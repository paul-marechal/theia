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

import { inject, injectable } from 'inversify';
import { io, Socket } from 'socket.io-client';
import { FRONTEND_SESSION_ID_KEY } from '../../common/messaging/frontend-session';
import { AbstractConnection, Connection, ConnectionProvider, ConnectionState, GetConnectionOptions } from '../../common/messaging/connection';
import { CurrentFrontendSession } from './current-frontend-session';

@injectable()
export class SocketIoConnectionProvider implements ConnectionProvider {

    protected _connections = new Map<string, Connection>();

    @inject(CurrentFrontendSession)
    protected _connectionScope: CurrentFrontendSession;

    async getConnection(path: string, options: GetConnectionOptions = {}): Promise<Connection> {
        // const { mode } = { ...GetConnectionOptions.Default, ...options };
        const socket = this._createSocketIo(path);
        return this._createSocketIoConnection(path, socket);
    }

    protected _createSocketIo(path: string): Socket {
        return io(path, {
            auth: {
                [FRONTEND_SESSION_ID_KEY]: this._connectionScope.sessionId
            }
        });
    }

    protected _createSocketIoConnection(path: string, socket: Socket): Connection {
        return new SocketIoClientConnection(path, socket);
    }
}

export class SocketIoClientConnection extends AbstractConnection {

    constructor(public path: string, protected _socket: Socket) {
        super();
        this._socket.on('connect', () => this._stateMachine.state = ConnectionState.OPENED);
        this._socket.on('message', message => this._onMessageEmitter.fire(message));
        this._socket.on('disconnect', () => {
            if (!this._socket.active) {
                this._stateMachine.state = ConnectionState.CLOSED;
                this._onCloseEmitter.fire();
            }
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
