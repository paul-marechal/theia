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

import Route = require('route-parser');
import { inject, injectable, named, postConstruct } from 'inversify';
import { Event } from '../../common/event';
import { RouteMatcher, RouteParams } from '../../common/messaging/route-matcher';
import { ContributionProvider } from '../../common/contribution-provider';
import { Connection, ConnectionState } from '../../common/messaging/connection';
import { FrontendSession, FrontendSessionRegistry } from './frontend-session';

export const ConnectionRouter = Symbol('ConnectionRouter');
/**
 * Route connections to the proper handlers.
 *
 * Register handlers through the `ConnectionHandler` binding.
 *
 * Route connections by calling `ConnectionRouter.routeConnection(...)`.
 */
export interface ConnectionRouter {
    routeConnection(sessionId: string, path: string, connection: Connection): Promise<object | undefined>;
}

export const ConnectionHandler = Symbol('ConnectionHandler');
/**
 * Handle `Connection` objects opened with a `path` matching some `route` pattern.
 */
export interface ConnectionHandler<T extends {} = { [key: string]: unknown }> {
    /**
     * A [`route-parser`](https://www.npmjs.com/package/route-parser) pattern.
     *
     * If matched, the `ConnectionRouter` will call `handleConnection` on this `ConnectionHandler`.
     */
    route: RouteMatcher<T> | string
    /**
     * Handle connections opened for a path matching the defined `route`.
     */
    handleConnection(connection: Connection, connectionParams: RouteParams<T>, scope: FrontendSession): Promise<boolean>
    /**
     * If the `ConnectionHandler` belongs to a scoped connection then `dispose` will be called once
     * the scope is disposed. Run any cleanup logic here.
     */
    dispose?(): void
}

/**
 * The default connection router handles a few different cases:
 *
 * First we have "global" connection handlers that may answer any connection.
 * Those handlers are stored in `_handlers`.
 *
 * Lastly we need to match the supplied connection scope id in order to find
 * the container and services bound to that specific scope. For example this happens
 * when dealing with plugins: Each frontend might have it's own services handling each
 * dedicated plugin-host processes.
 */
@injectable()
export class DefaultConnectionRouter implements ConnectionRouter {

    protected _handlers: [RouteMatcher, ConnectionHandler][];
    protected _sessionHandlers = new WeakMap<FrontendSession, [RouteMatcher, ConnectionHandler][]>();

    @inject(ContributionProvider) @named(ConnectionHandler)
    protected _connectionHandlers: ContributionProvider<ConnectionHandler>;

    @inject(FrontendSessionRegistry)
    protected _frontendSessionRegistry: FrontendSessionRegistry;

    @postConstruct()
    postConstruct(): void {
        this._handlers = this._connectionHandlers.getContributions().map(
            handler => this._convertConnectionHandler(handler)
        );
    }

    async routeConnection(sessionId: string, path: string, connection: Connection): Promise<object | undefined> {
        if (ConnectionState.isClosed(connection)) {
            console.debug('connection was closed before being handled.');
            return;
        }
        const scope = this._frontendSessionRegistry.getFrontendSessionFor(sessionId, connection);
        const sessionHandlers = this._getSessionHandlers(scope);
        for (const [route, handler] of this._handlers.concat(sessionHandlers)) {
            const params = route.match(path);
            if (params) {
                if (ConnectionState.isClosed(connection)) {
                    console.debug('connection was closed before being handled.');
                    return;
                }
                try {
                    if (await handler.handleConnection(connection, params, scope)) {
                        return {};
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    protected _convertConnectionHandler(handler: ConnectionHandler): [RouteMatcher, ConnectionHandler] {
        const { route } = handler;
        const routeMatcher = typeof route === 'string' ? this._createRouteMatcher(route) : route;
        return [routeMatcher, handler];
    }

    protected _getSessionHandlers(session: FrontendSession): [RouteMatcher, ConnectionHandler][] {
        let handlers = this._sessionHandlers.get(session);
        if (!handlers) {
            const connectionHandlers = session.container.getNamed<ContributionProvider<ConnectionHandler>>(ContributionProvider, ConnectionHandler);
            this._sessionHandlers.set(session, handlers = connectionHandlers.getContributions(true).map(
                handler => this._convertConnectionHandler(handler)
            ));
            Event.listenOnce(session.onEmpty, () => handlers!.forEach(([_route, handler]) => handler.dispose?.()));
        }
        return handlers;
    }

    protected _createRouteMatcher(route: string): RouteMatcher {
        return new Route(route);
    }
}
