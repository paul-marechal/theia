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

import * as http from 'http';
import * as https from 'https';
import { inject, injectable } from 'inversify';
import { Server, Socket } from 'socket.io';
import { FRONTEND_SESSION_ID_KEY } from '../common/messaging/frontend-session';
import { AbstractConnection, Connection, ConnectionState } from '../common/messaging/connection';
import { BackendApplicationContribution } from './backend-application';
import { ConnectionRouter } from './messaging/connection-router';

@injectable()
export class SocketIoServer implements BackendApplicationContribution {

    protected _socketIoServer?: Server;

    @inject(ConnectionRouter)
    protected _connectionRouter: ConnectionRouter;

    onStart(server: http.Server | https.Server): void {
        this._socketIoServer = this._createSocketIoServer(server);
        this._socketIoServer
            .of(/.*/)
            .use(async (socket: Socket, next) => {
                const sessionId = this._getFrontendSessionId(socket);
                if (sessionId) {
                    const path = socket.nsp.name;
                    const connection = this._createSocketIoConnection(path, socket);
                    if (await this._connectionRouter.routeConnection(sessionId, path, connection)) {
                        next();
                    } else {
                        next(new Error('unhandled connection'));
                    }
                } else {
                    next(new Error('missing auth.sessionId'));
                }
            });
    }

    protected _createSocketIoServer(server: http.Server | https.Server): Server {
        return new Server(server);
    }

    protected _createSocketIoConnection(path: string, socket: Socket): Connection {
        return new SocketIoConnection(path, socket);
    }

    protected _getFrontendSessionId(socket: Socket): string | undefined {
        // Trim the value and coerce to `undefined` if we get an empty string.
        return socket.handshake.auth[FRONTEND_SESSION_ID_KEY]?.trim() || undefined;
    }
}

export class SocketIoConnection extends AbstractConnection {

    constructor(public path: string, protected _socket: Socket) {
        super();
        this._socket.on('connect', () => this._stateMachine.state = ConnectionState.OPENED);
        this._socket.on('message', message => this._onMessageEmitter.fire(message));
        this._socket.on('disconnect', () => {
            this._stateMachine.state = ConnectionState.CLOSED;
            this._onCloseEmitter.fire();
        });
    }

    close(): void {
        this._stateMachine.state = ConnectionState.CLOSING;
        this._socket.disconnect();
    }

    sendMessage(message: string): void {
        this._socket.send(message);
    }
}
