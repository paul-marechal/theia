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
import * as jsonrpc from 'vscode-jsonrpc';
import { JsonRpc } from './json-rpc';
import { Connection, ConnectionProvider } from './connection';
import { ServiceDescriptor } from '../service';
import { getServiceId, ProxyProvider } from './proxy-provider';
import { getJsonRpcProxyPath } from './json-rpc-route';

@injectable()
export class JsonRpcProxyProvider implements ProxyProvider {

    @inject(ConnectionProvider)
    protected connectionProvider: ConnectionProvider;

    @inject(JsonRpc)
    protected _jsonRpc: JsonRpc;

    getProxyById<T extends object>(arg: string | ServiceDescriptor<T>): T {
        const path = getJsonRpcProxyPath(getServiceId(arg));
        const connectionPromise = this.connectionProvider.getConnection(path);
        const messageConnectionPromise = connectionPromise.then(connection => this._getJsonRpcMessageConnection(connection));
        return this._jsonRpc.createJsonRpcProxy<T>(messageConnectionPromise);
    }

    getProxyOverConnection<T extends object>(connection: Connection): T {
        const messageConnection = this._getJsonRpcMessageConnection(connection);
        return this._jsonRpc.createJsonRpcProxy<T>(Promise.resolve(messageConnection));
    }

    protected _getJsonRpcMessageConnection(connection: Connection): jsonrpc.MessageConnection {
        const logger = this._getJsonRpcLogger();
        const options = this._getJsonRpcConnectionOptions();
        return this._jsonRpc.getJsonRpcMessageConnection(connection, logger, options);
    }

    protected _getJsonRpcLogger(): jsonrpc.Logger | undefined {
        return console;
    }

    protected _getJsonRpcConnectionOptions(): jsonrpc.ConnectionOptions | undefined {
        return undefined;
    }
}
