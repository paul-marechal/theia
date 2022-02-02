/********************************************************************************
 * Copyright (C) 2022 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable } from 'inversify';
import * as jsonrpc from 'vscode-jsonrpc/lib/common/api';
import { Disposable, DisposableCollection } from '../disposable';
import { Emitter, Event } from '../event';
import { Connection } from './connection';

export const JsonRpc = Symbol('JsonRpc');
export interface JsonRpc {
    getJsonRpcMessageConnection(connection: Connection, logger?: jsonrpc.Logger, options?: jsonrpc.ConnectionOptions): jsonrpc.MessageConnection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createJsonRpcProxy<T = any>(messageConnectionPromise: Promise<jsonrpc.MessageConnection>): T
    createJsonRpcServer(messageConnection: jsonrpc.MessageConnection, server: { [key: string]: Function }): Disposable
}

@injectable()
export class DefaultJsonRpc implements JsonRpc {

    protected _messageConnectionCache = new WeakMap<Connection, jsonrpc.MessageConnection>();

    getJsonRpcMessageConnection(connection: Connection, logger?: jsonrpc.Logger, options?: jsonrpc.ConnectionOptions): jsonrpc.MessageConnection {
        let messageConnection = this._messageConnectionCache.get(connection);
        if (!messageConnection) {
            const reader: jsonrpc.MessageReader = {
                dispose: () => undefined,
                listen: callback => connection.onMessage(message => callback(JSON.parse(message))),
                onClose: callback => connection.onClose(() => callback()),
                onError: Event.None,
                onPartialMessage: Event.None
            };
            const writer: jsonrpc.MessageWriter = {
                dispose: () => undefined,
                end: () => undefined,
                onClose: callback => connection.onClose(() => callback()),
                onError: Event.None,
                write: async message => connection.sendMessage(JSON.stringify(message))
            };
            messageConnection = jsonrpc.createMessageConnection(reader, writer, logger, options);
            Event.listenOnce(connection.onClose, () => this._messageConnectionCache.delete(connection));
            this._messageConnectionCache.set(connection, messageConnection);
        }
        return messageConnection;
    }

    createJsonRpcProxy<T>(messageConnectionPromise: Promise<jsonrpc.MessageConnection>): T {
        const emitters = new Map<string, Emitter>();
        const cache = new Map<string, Event<unknown> | Function>();
        let messageConnection: jsonrpc.MessageConnection | undefined;
        // First promise in the promise queue is to wait for the messageConnection to be resolved
        let messageQueue: Promise<unknown> = messageConnectionPromise.then(mc => {
            messageConnection = mc;
            messageConnection.onNotification((method, params) => {
                const emitter = emitters.get(method);
                if (emitter) {
                    if (params === undefined) {
                        return emitter.fire(undefined);
                    } else if (!Array.isArray(params)) {
                        throw new Error('only Array params supported');
                    }
                    return emitter.fire(params[0]);
                }
            });
            messageConnection.onClose(() => {
                emitters.forEach(emitter => emitter.dispose());
                emitters.clear();
                cache.clear();
            });
        });
        // eslint-disable-next-line no-null/no-null
        return new Proxy(Object.freeze(Object.create(null)), {
            get: (target, property, receiver) => {
                if (typeof property !== 'string') {
                    return;
                }
                let value = cache.get(property);
                if (!value) {
                    if (this._isEventName(property)) {
                        const emitter = new Emitter();
                        emitters.set(property, emitter);
                        value = emitter.event;
                    } else {
                        value = async (...args: unknown[]) => {
                            // Submit the request and wait for a response or an error
                            const response = messageQueue
                                .then(async () => messageConnection!.sendRequest(property, jsonrpc.ParameterStructures.byPosition, ...args))
                                .catch(error => this._handleJsonRpcResponseError(error));
                            messageQueue = response.catch(() => { /** swallow errors to not reject the queue */ });
                            return response;
                        };
                    }
                    cache.set(property, value);
                }
                return value;
            },
        });
    }

    createJsonRpcServer(messageConnection: jsonrpc.MessageConnection, server: { [key: string]: Function }): Disposable {
        const disposables = new DisposableCollection(
            messageConnection.onRequest((method, params, token) => {
                if (params === undefined) {
                    return server[method](token);
                } else if (!Array.isArray(params)) {
                    throw new Error('only Array is supported for request params');
                }
                return server[method](...params, token);
            }),
            messageConnection.onNotification((method, params) => {
                if (params === undefined) {
                    return server[method]();
                } else if (!Array.isArray(params)) {
                    throw new Error('only Array is supported for notification params');
                }
                return server[method](...params);
            }),
            messageConnection.onClose(() => {
                disposables.dispose();
            }),
            ...Array.from(
                this._getEventNames(server),
                eventName => server[eventName]((event: unknown) => messageConnection.sendNotification(eventName, event))
            ),
        );
        return disposables;
    }

    protected _getEventNames(instance: object): Set<string> {
        // Start with the passed instance, then recursively get methods of parent prototypes
        const events = new Set<string>();
        let current: object | null = instance;
        do {
            for (const property of Object.getOwnPropertyNames(current)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (this._isEventName(property) && typeof (current as any)[property] === 'function') {
                    events.add(property);
                }
            }
        } while (current = Object.getPrototypeOf(current));
        return events;
    }

    protected _isEventName(name: string): boolean {
        return /^on[A-Z]/.test(name);
    }

    /**
     * @throws By default this method will deserialize application errors before throwing them again.
     */
    protected _handleJsonRpcResponseError(error: Error): never {
        // TODO: deserialize
        throw error;
    }
}
