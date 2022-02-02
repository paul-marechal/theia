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
import { Connection } from '../../common/messaging/connection';
import { JsonRpc } from '../../common/messaging/json-rpc';
import { JsonRpcProxyRouteParams, JSON_RPC_PROXY_HANDLER_ROUTE } from '../../common/messaging/json-rpc-route';
import { ConnectionHandler } from './connection-router';
import { FrontendSession } from './frontend-session';
import { ServiceRegistry } from './service-provider';

@injectable()
export class JsonRpcProxyConnectionHandler implements ConnectionHandler<JsonRpcProxyRouteParams> {

    route = JSON_RPC_PROXY_HANDLER_ROUTE;

    @inject(ServiceRegistry)
    protected _serviceRegistry: ServiceRegistry;

    @inject(JsonRpc)
    protected _jsonRpc: JsonRpc;

    async handleConnection(connection: Connection, connectionParams: JsonRpcProxyRouteParams, session: FrontendSession): Promise<boolean> {
        const { serviceId } = connectionParams;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const service = this._serviceRegistry.getService<any>(serviceId, session);
        const messageConnection = this._jsonRpc.getJsonRpcMessageConnection(connection);
        this._jsonRpc.createJsonRpcServer(messageConnection, service);
        return true;
    }
}
