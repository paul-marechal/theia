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

import { ContributionProvider, Emitter, Event } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { DisabledPlugin, EnabledPlugin, InstalledPlugin, Plugin } from '../common/plugin';
import { PluginUri } from '../common/plugin-uri';
import { PluginDescriptor, PluginManager, PluginProvider, PluginReducer, ProvidedPlugins, UpdatePluginsEvent } from './plugin-manager';

@injectable()
export class DefaultPluginManager implements PluginManager {

    protected onDidAddPluginEmitter = new Emitter<Plugin>();
    protected onDidRemovePluginEmitter = new Emitter<string>();
    protected plugins = new Map<string, PluginHandle>();
    protected providers: PluginProvider[];

    @inject(PluginUri) protected pluginUri: PluginUri;
    @inject(PluginReducer) protected reducer: PluginReducer;

    constructor(
        @inject(ContributionProvider) @named(PluginProvider)
        providers: ContributionProvider<PluginProvider>
    ) {
        this.providers = providers.getContributions();
        this.providers.forEach(provider => {
            provider.onDidUpdatePlugins(event => {
                this.handleUpdatePluginsEvent(provider, event);
            });
        });
    }

    get onDidAddPlugin(): Event<Plugin> {
        return this.onDidAddPluginEmitter.event;
    }

    get onDidRemovePlugin(): Event<string> {
        return this.onDidRemovePluginEmitter.event;
    }

    async getPlugin(pluginUri: URI | string): Promise<Plugin | undefined> {
        const radical = this.pluginUri.radical(pluginUri);
        if (!radical) {
            return;
        }
        const provided = await Promise.all<ProvidedPlugins>(this.providers.map(
            async provider => {
                const plugins = [];
                const found = await provider.getPlugin(radical);
                if (found) {
                    plugins[0] = found;
                }
                return { provider, plugins };
            }
        ));
        const reduced = (await this.reducer.reducePlugins(provided))?.[radical];
        if (reduced) {
            return this.updateOrCreatePlugin(radical, reduced.provider, reduced.plugin);
        }
    }

    async getPlugins(): Promise<Plugin[]> {
        const provided = await Promise.all<ProvidedPlugins>(this.providers.map(
            async provider => ({
                provider,
                plugins: await provider.getPlugins()
            })
        ));
        const reduced = await this.reducer.reducePlugins(provided);
        return Object.entries(reduced).map(
            ([pluginUri, { provider, plugin }]) => this.updateOrCreatePlugin(pluginUri, provider, plugin)
        );
    }

    protected updateOrCreatePlugin(pluginUri: string, provider: PluginProvider, description: PluginDescriptor): PluginHandle {
        let provided = this.plugins.get(pluginUri);
        if (provided) {
            provided.update(description);
        } else {
            this.plugins.set(pluginUri, provided = new PluginHandle(provider, description));
            this.onDidAddPluginEmitter.fire(provided);
        }
        return provided;
    }

    protected deletePlugin(pluginUri: string, provider: PluginProvider): void {
        this.plugins.delete(pluginUri);
        this.onDidRemovePluginEmitter.fire(pluginUri);
    }

    protected handleUpdatePluginsEvent(provider: PluginProvider, event: UpdatePluginsEvent): void {
        const provided: ProvidedPlugins = {
            provider,
            plugins: Object.values(event).map(plugin => plugin ?? {
                type: '',
                id: '',
                builtin: false,
                enabled: false,
                installed: false,
                loaded: false,
                busy: Plugin.Transition.None
            })
        };
        this.reducer.reducePlugins([provided]).then(reduced => {
            Object.entries(reduced).forEach(([pluginUri, { plugin }]) => {
                if (plugin.installed) {
                    this.updateOrCreatePlugin(pluginUri, provider, plugin);
                } else {
                    this.deletePlugin(pluginUri, provider);
                }
            });
        });
    }
}

export class PluginHandle implements Plugin, EnabledPlugin, DisabledPlugin, InstalledPlugin {

    protected onDidChangePluginEmitter = new Emitter<void>();
    protected pluginDescriptor: PluginDescriptor;

    constructor(
        protected provider: PluginProvider,
        pluginDescriptor: PluginDescriptor
    ) {
        this.pluginDescriptor = { ...pluginDescriptor };
    }

    get onDidChangePlugin(): Event<void> {
        return this.onDidChangePluginEmitter.event;
    }

    get type(): string {
        return this.pluginDescriptor.type;
    }

    get id(): string {
        return this.pluginDescriptor.id;
    }

    get busy(): Plugin.Transition {
        return this.pluginDescriptor.busy;
    }

    get builtin(): boolean {
        return this.pluginDescriptor.builtin;
    }

    get installed(): boolean {
        return this.pluginDescriptor.installed;
    }

    get loaded(): boolean {
        return this.pluginDescriptor.loaded;
    }

    get enabled(): boolean {
        return this.pluginDescriptor.enabled;
    }

    async enable(): Promise<void> {
        await this.provider.enablePlugin(this.id);
    }

    async disable(): Promise<void> {
        await this.provider.disablePlugin(this.id);
    }

    async uninstall(): Promise<void> {
        await this.provider.uninstallPlugin(this.id);
    }

    update(description: PluginDescriptor): void {
        this.pluginDescriptor = { ...description };
        this.onDidChangePluginEmitter.fire();
    }
}
