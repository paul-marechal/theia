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

import { ContributionProvider, MaybePromise } from '@theia/core';
import { TreeElement, TreeSource } from '@theia/core/lib/browser/source-tree';
import { ConcurrencyLock } from '@theia/core/lib/common/decorators';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import { v4 } from 'uuid';
import { PluginQuery } from '../common/plugin-query';
import { PluginUri } from '../common/plugin-uri';

export interface ProvidedPlugin {
    providerId: string
    pluginId: string
    pluginType: string
    installed: boolean
    loaded: boolean
    enabled: boolean
    builtin: boolean
}

export const PluginTreeSourceProvider = Symbol('PluginTreeSourceProvider');
export interface PluginProviderContribution {
    id?: string
    providePlugins(query: PluginQuery): MaybePromise<ProvidedPlugin[]>;
    provideTreeElement(pluginId: string): TreeElement;
}

export const PluginReducer = Symbol('PluginReducer');
export interface PluginReducer {
    reduceProvidedPlugins(plugins: ProvidedPlugin[]): MaybePromise<Map<string, string[]>>;
}

export const PluginProviderHandler = Symbol('PluginProviderHandler');
export interface PluginProviderHandler {
    providePlugins(query: PluginQuery): MaybePromise<ProvidedPlugin[]>;
    provideTreeElement(pluginId: string): TreeElement;
}

@injectable()
export class DefaultPluginProvider {

    protected providers = new Map<string, PluginProviderContribution>();

    constructor(
        @inject(ContributionProvider) @named(PluginTreeSourceProvider)
        contributions: ContributionProvider<PluginProviderContribution>
    ) {
        contributions.getContributions().forEach(provider => {
            if (!provider.id) {
                provider.id = v4();
            }
            this.providers.set(provider.id, provider);
        });
    }

    getPluginProvider(id: string): PluginProviderContribution | undefined {
        return this.providers.get(id);
    }

    async providePlugins(query: PluginQuery): Promise<ProvidedPlugin[]> {
        let plugins: ProvidedPlugin[] = [];
        const tasks: Promise<void>[] = [];
        this.providers.forEach((provider, providerId) => {
            tasks.push(Promise.resolve(provider.providePlugins(query)).then(provided => {
                plugins = plugins.concat(provided);
            }));
        });
        await Promise.all(tasks);
        return plugins;
    }

    provideTreeElement(rendererId: string, pluginId: string): TreeElement {
        const provider = this.getPluginProvider(rendererId);
        if (!provider) {
            throw new Error(`not found: providerId=${rendererId}`);
        }
        return provider.provideTreeElement(pluginId);
    }
}

@injectable()
export class DefaultPluginReducer implements PluginReducer {

    reduceProvidedPlugins(provided: ProvidedPlugin[]): Map<string, string[]> {
        const plugins = new Map<string, string[]>();
        provided.forEach(plugin => {
            const radical = PluginUri.radical(plugin.pluginId)!;
            let versions = plugins.get(radical);
            if (!versions) {
                plugins.set(radical, versions = []);
            }
            versions.push(plugin.pluginId);
        });
        plugins.forEach((versions, radical) => {
            versions
                .filter(version => true)
                .sort((a, b) => 0);
        });
        return plugins;
    }
}

@injectable()
export class PluginTreeSource extends TreeSource {

    protected cachedTreeElements = new Map<string, TreeElement>();

    @inject(DefaultPluginProvider)
    protected provider: DefaultPluginProvider;

    @inject(PluginReducer)
    protected reducer: PluginReducer;

    getElements(): IterableIterator<TreeElement> {
        return this.cachedTreeElements.values();
    }

    @ConcurrencyLock()
    async updateQuery(query: PluginQuery): Promise<void> {
        const provided = await this.provider.providePlugins(query);
        const plugins = await this.reducer.reduceProvidedPlugins(provided);
        this.cachedTreeElements.clear();
        // plugins.forEach(({ pluginId, providerId }) => {
        //     this.cachedTreeElements.set(pluginId, this.provider.provideTreeElement(providerId, pluginId));
        // });
        plugins.forEach((pluginUri, pluginVersions) => { });
        this.fireDidChange();
    }
}
