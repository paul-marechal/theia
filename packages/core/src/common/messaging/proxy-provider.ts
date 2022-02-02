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

import { interfaces } from 'inversify';
import { ServiceDescriptor } from '../service';
import { Connection } from './connection';

export interface ProxyInfo<T = unknown> {
    path: string
    connection: Connection
}

export const ProxyProvider = Symbol('ProxyProvider');
export interface ProxyProvider {
    getProxyById<T extends object>(descriptor: ServiceDescriptor<T>): T
    getProxyById<T extends object>(path: string): T
    getProxyOverConnection<T extends object>(connection: Connection): T
}

/**
 * Helper function to bind proxies using inversify.
 */
export function dynamicProxy<T extends object>(proxyProvider: interfaces.ServiceIdentifier<ProxyProvider>, path: string): (ctx: interfaces.Context) => T {
    return ctx => ctx.container.get(proxyProvider).getProxyById<T>(path);
}

export function getServiceId(arg: string | ServiceDescriptor<unknown>): string {
    return typeof arg === 'string' ? arg : arg.id;
}
