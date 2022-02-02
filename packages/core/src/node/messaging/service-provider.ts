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
import { inject, injectable, postConstruct } from 'inversify';
import { ContributionProvider } from '../../common/contribution-provider';
import { Event } from '../../common/event';
import { RouteMatcher, RouteParams } from '../../common/messaging/route-matcher';
import { FrontendSession } from './frontend-session';

export const ServiceRegistry = Symbol('ServiceRegistry');
export interface ServiceRegistry {
    getService<T extends {}>(serviceId: string, session?: FrontendSession): T
}

export const ServiceProvider = Symbol('ServiceProvider');
/**
 * Provide services based on some `route` matching requested service IDs.
 */
export interface ServiceProvider<T extends {} = { [key: string]: unknown }> {
    route: RouteMatcher<T> | string
    getService<U extends {}>(serviceId: string, params: RouteParams<T>, session?: FrontendSession): U | null | false | undefined
    dispose?(): void
}

@injectable()
export class DefaultServiceRegistry implements ServiceRegistry {

    protected _providers: [RouteMatcher, ServiceProvider][];
    protected _sessionProviders = new WeakMap<FrontendSession, [RouteMatcher, ServiceProvider][]>();

    @inject(ContributionProvider)
    protected _serviceProviders: ContributionProvider<ServiceProvider>;

    @postConstruct()
    postConstruct(): void {
        this._providers = this._serviceProviders.getContributions().map(
            provider => this._convertServiceProvider(provider)
        );
    }

    getService<T extends {}>(serviceId: string, session?: FrontendSession): T {
        const sessionProviders = session ? this._getSessionServiceProviders(session) : [];
        for (const [route, provider] of this._providers.concat(sessionProviders)) {
            const params = route.match(serviceId);
            if (params) {
                try {
                    const service = provider.getService<T>(serviceId, params, session);
                    if (service) {
                        return service;
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        throw new Error(`service not found: ${serviceId}`);
    }

    protected _getSessionServiceProviders(session: FrontendSession): [RouteMatcher, ServiceProvider][] {
        let services = this._sessionProviders.get(session);
        if (!services) {
            const sessionProviders = session.container.getNamed<ContributionProvider<ServiceProvider>>(ContributionProvider, ServiceProvider);
            this._sessionProviders.set(session, services = sessionProviders.getContributions().map(
                provider => this._convertServiceProvider(provider)
            ));
            Event.listenOnce(session.onEmpty, () => services!.forEach(([_route, provider]) => provider.dispose?.()));
        }
        return services;
    }

    protected _convertServiceProvider(provider: ServiceProvider): [RouteMatcher, ServiceProvider] {
        const { route } = provider;
        const routeMatcher = typeof route === 'string' ? this._createRouteMatcher(route) : route;
        return [routeMatcher, provider];
    }

    protected _createRouteMatcher(route: string): RouteMatcher {
        return new Route(route);
    }
}
