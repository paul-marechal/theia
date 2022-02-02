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

import { StateMachine } from '../state-machine';
import { Emitter, Event } from '../event';

export enum ConnectionState {
    CONNECTING,
    OPENED,
    CLOSING,
    CLOSED,
}
export namespace ConnectionState {
    export function isClosed(connection: Connection): connection is Connection & { state: ConnectionState.CLOSING | ConnectionState.CLOSED } {
        return connection.state === ConnectionState.CLOSING || connection.state === ConnectionState.CLOSED;
    }
}

/**
 * A `Connection` allows you to listen for messages and send messages back.
 *
 * Implementations should mostly be API adapters only (avoid data transformation).
 */
export interface Connection {
    /**
     * The logic path of the connection, for internal routing.
     *
     * This is not the HTTP REST endpoint on which the connection was opened!
     */
    readonly path: string
    readonly state: ConnectionState
    onClose: Event<void>
    onError: Event<Error>
    onMessage: Event<string>
    sendMessage(message: string): void
    close(): void
}

export abstract class AbstractConnection implements Connection {

    abstract path: string;

    protected _stateMachine = createConnectionStateMachine();
    protected _onCloseEmitter = new Emitter<void>();
    protected _onErrorEmitter = new Emitter<Error>();
    protected _onMessageEmitter = new Emitter<string>();

    get state(): ConnectionState {
        return this._stateMachine.state;
    }

    get onClose(): Event<void> {
        return this._onCloseEmitter.event;
    }

    get onError(): Event<Error> {
        return this._onErrorEmitter.event;
    }

    get onMessage(): Event<string> {
        return this._onMessageEmitter.event;
    }

    abstract close(): void;

    abstract sendMessage(message: string): void;
}

export enum GetConnectionModes {
    GET,
    GET_OR_CREATE,
    CREATE,
}

export interface GetConnectionOptions {
    /**
     * @default GetConnectionModes.GET_OR_CREATE
     */
    mode?: GetConnectionModes
}
export namespace GetConnectionOptions {
    export const Default: Required<GetConnectionOptions> = {
        mode: GetConnectionModes.GET_OR_CREATE
    };
}

export const ConnectionProvider = Symbol('ConnectionProvider');
export interface ConnectionProvider {
    getConnection(path: string, options?: GetConnectionOptions): Promise<Connection>
}

export function createConnectionStateMachine(initial = ConnectionState.CONNECTING): StateMachine<ConnectionState> {
    return new StateMachine<ConnectionState>({
        [ConnectionState.CONNECTING]: [ConnectionState.OPENED, ConnectionState.CLOSING, ConnectionState.CLOSED],
        [ConnectionState.OPENED]: [ConnectionState.OPENED, ConnectionState.CLOSING, ConnectionState.CLOSED],
        [ConnectionState.CLOSING]: [ConnectionState.CLOSED],
        [ConnectionState.CLOSED]: []
    }, initial);
}
