// *****************************************************************************
// Copyright (C) 2022 Ericsson and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
// *****************************************************************************

/* eslint-disable no-null/no-null */

import { ContributionProvider, Event } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { Plugin } from '../common/plugin';
import { PluginUri } from '../common/plugin-uri';

export const PluginManager = Symbol('PluginManager');
export interface PluginManager {
    getPlugins(): Promise<Plugin[]>;
    getPlugin(pluginUri: URI | string): Promise<Plugin | undefined>;
}

export interface PluginDescriptor {
    id: string
    loaded: boolean
    enabled: boolean
    busy: unknown
}

export interface UpdatePluginsEvent {
    [pluginUri: string]: PluginDescriptor | null
}

export const PluginProviderContribution = Symbol('PluginProviderContribution');
export interface PluginProviderContribution {
    onDidUpdatePlugins: Event<UpdatePluginsEvent>;
    getPlugins(): Promise<PluginDescriptor[]>;
    getPlugin(pluginUri: string): Promise<PluginDescriptor | undefined>;
    enablePlugin(pluginUri: string): Promise<void>;
    disablePlugin(pluginUri: string): Promise<void>;
    uninstallPlugin(pluginUri: string): Promise<void>;
}

@injectable()
export class DefaultPluginManager implements PluginManager {

    protected plugins = new Map<string, ProvidedPlugin>();
    protected providers: PluginProviderContribution[];

    @inject(PluginUri) protected pluginUri: PluginUri;

    constructor(
        @inject(ContributionProvider) @named(PluginProviderContribution)
        providers: ContributionProvider<PluginProviderContribution>
    ) {
        this.providers = providers.getContributions();
        this.providers.forEach(provider => provider.onDidUpdatePlugins(this.handleUpdatePluginsEvent, this));
    }

    async getPlugin(pluginUri: URI | string): Promise<Plugin | undefined> {
        const radical = this.pluginUri.radical(pluginUri);
        if (!radical) {
            return;
        }
        let plugin = this.plugins.get(radical);
        if (!plugin) {
            plugin = await Promise.race(this.providers.map(async provider => {
                const pluginDescriptor = await provider.getPlugin(radical);
                if (pluginDescriptor) {
                    return new ProvidedPlugin(pluginDescriptor, provider);
                }
            }));
            if (plugin) {
                this.plugins.set(radical, plugin);
            }
        }
        return plugin;
    }

    async getPlugins(): Promise<Plugin[]> {
        const plugins = await Promise.all(this.providers.map(async provider => {
            const provided = await provider.getPlugins();
            return provided.map(plugin => new ProvidedPlugin(plugin, provider));
        }));
        return plugins.flat();
    }

    protected handleUpdatePluginsEvent(event: UpdatePluginsEvent): void {
        Object.entries(event).forEach(([pluginUri, pluginDescriptor]) => {
            if (pluginDescriptor === null) {
                this.plugins.delete(pluginUri);
            } else {
                this.plugins.get(pluginUri);
            }
        });
    }
}

export class ProvidedPlugin implements Plugin {

    type: Plugin.Type;
    busy: Plugin.Transition;
    onDidChangePlugin: Event<void>;

    constructor(
        protected pluginDescriptor: PluginDescriptor,
        protected provider: PluginProviderContribution
    ) { }

    get id(): string {
        return this.pluginDescriptor.id;
    }

    get installed(): boolean {
        return true;
    }

    get loaded(): boolean {
        return this.pluginDescriptor.loaded;
    }

    get enabled(): boolean {
        return this.pluginDescriptor.enabled;
    }
}
