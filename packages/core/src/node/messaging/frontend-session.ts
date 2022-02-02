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

import { inject, injectable, interfaces, named } from 'inversify';
import { Disposable } from '../../common/disposable';
import { ContributionProvider } from '../../common/contribution-provider';
import { Emitter, Event } from '../../common/event';
import { Connection, ConnectionState } from '../../common/messaging/connection';
import { ConnectionContainerModule } from './connection-container-module';

export const FrontendSession = Symbol('FrontendSession');
/**
 * Regroup connections that belong to the same logical session.
 */
export interface FrontendSession {
    id: string
    /**
     * The set of connections that belong to this session.
     */
    connections: ReadonlySet<Connection>
    /**
     * This event is fired once the set of connections goes from more than 0 down to 0.
     */
    onEmpty: Event<void>
    /**
     * Inversify container with bindings for this session.
     */
    container: interfaces.Container;
    /**
     * `true` when all connections for this session are closed.
     */
    isEmpty(): boolean
    /**
     * @throws If `connection` is closing or closed.
     */
    registerConnection(connection: Connection): void
    /**
     * Empty the `connections` map and fire `onEmpty`.
     */
    clear(): void
}

export const ChildContainerFactory = Symbol('ChildContainerFactory');
export type ChildContainerFactory = () => interfaces.Container;

export const FrontendSessionRegistry = Symbol('FrontendSessionRegistry');
export interface FrontendSessionRegistry {
    /**
     * Get an existing `FrontendSession` if any.
     */
    getFrontendSession(sessionId: string): FrontendSession | undefined
    /**
     * Get or create a connection scope for `connection`.
     * @param sessionId
     * @param connection Connection to register to the returned scope.
     * @returns Non-empty `FrontendSession` referencing `connection`.
     * @throws If `connection` is closed or closing.
     */
    getFrontendSessionFor(sessionId: string, connection: Connection): FrontendSession
}

@injectable()
export class DefaultFrontendSessionRegistry implements FrontendSessionRegistry {

    /**
     * `sessionId`: `session`
     */
    protected _sessions = new Map<string, FrontendSession>();

    @inject(ChildContainerFactory)
    protected _childContainerFactory: ChildContainerFactory;

    @inject(ContributionProvider) @named(ConnectionContainerModule)
    protected _connectionModules: ContributionProvider<interfaces.ContainerModule>;

    getFrontendSession(sessionId: string): FrontendSession | undefined {
        return this._sessions.get(sessionId);
    }

    getFrontendSessionFor(sessionId: string, connection: Connection): FrontendSession {
        let session = this._sessions.get(sessionId);
        if (!session) {
            session = this._createFrontendSession(sessionId);
        }
        session.registerConnection(connection);
        this._sessions.set(sessionId, session);
        Event.listenOnce(session.onEmpty, () => {
            this._sessions.delete(sessionId);
        });
        return session;
    }

    protected _createFrontendSession(sessionId: string): FrontendSession {
        return new DefaultFrontendSession(sessionId, this._createScopedContainer.bind(this));
    }

    protected _createScopedContainer(session: FrontendSession): interfaces.Container {
        const container = this._childContainerFactory();
        container.bind(FrontendSession).toConstantValue(session);
        container.load(...this._connectionModules.getContributions());
        return container;
    }
}

export class DefaultFrontendSession implements FrontendSession {

    protected _connections = new Map<Connection, Disposable>();
    protected _container?: interfaces.Container;
    protected _onEmptyEmitter = new Emitter<void>();

    connections = new MapKeySetView(this._connections);

    constructor(
        public id: string,
        protected _containerFactory: (scope: FrontendSession) => interfaces.Container
    ) { }

    get container(): interfaces.Container {
        if (!this._container) {
            this._container = this._containerFactory(this);
        }
        return this._container;
    }

    get onEmpty(): Event<void> {
        return this._onEmptyEmitter.event;
    }

    isEmpty(): boolean {
        return this._connections.size === 0;
    }

    registerConnection(connection: Connection): void {
        if (ConnectionState.isClosed(connection)) {
            throw new Error('connection is closed or closing.');
        }
        this._connections.set(connection, Event.listenOnce(connection.onClose, () => {
            this._connections.delete(connection);
            this._checkEmpty();
        }));
    }

    clear(): void {
        if (this._connections.size === 0) {
            return;
        }
        this._connections.forEach((listener, connection) => {
            this._connections.delete(connection);
            listener.dispose();
        });
        this._onEmptyEmitter.fire();
    }

    protected _checkEmpty(): void {
        if (this._connections.size === 0) {
            this._onEmptyEmitter.fire();
        }
    }
}

/**
 * `ReadonlySet` view of a `Map` keys.
 */
class MapKeySetView<T> implements ReadonlySet<T> {
    constructor(protected _map: Map<T, unknown>) { }
    [Symbol.iterator](): IterableIterator<T> {
        return this.keys();
    }
    *entries(): IterableIterator<[T, T]> {
        for (const key of this._map.keys()) { yield [key, key]; }
    }
    forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: unknown): void {
        this._map.forEach((_value, key) => callbackfn(key, key, this), thisArg);
    }
    has(value: T): boolean {
        return this._map.has(value);
    }
    keys(): IterableIterator<T> {
        return this._map.keys();
    }
    get size(): number {
        return this._map.size;
    }
    values(): IterableIterator<T> {
        return this._map.keys();
    }
}
