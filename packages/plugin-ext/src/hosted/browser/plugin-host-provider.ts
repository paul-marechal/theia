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

import { Emitter, Event } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { PluginDescriptor, PluginProvider, UpdatePluginsEvent } from '@theia/plugin-manager/lib/browser';
import { Plugin, PluginUri } from '@theia/plugin-manager/lib/common';
import { PluginIdentifiers, PluginType } from '../../common';
import { HostedPluginSupport, PluginContributions } from '../../hosted/browser/hosted-plugin';

@injectable()
export class PluginHostProvider implements PluginProvider {

    protected onDidUpdatePluginsEmitter = new Emitter<UpdatePluginsEvent>();
    /**
     * Set of ids from the last emitted `onDidUpdatePlugins` event.
     */
    protected lastUpdatePluginsEvent = new Set<string>();

    @inject(PluginUri) protected pluginUri: PluginUri;
    /**
     * Interacting with the `HostedPluginSupport` is a pain.
     */
    @inject(HostedPluginSupport) protected hostedPluginSupport: HostedPluginSupport;

    @postConstruct()
    protected postConstruct(): void {
        this.hostedPluginSupport.onDidChangePlugins(this.handleDidChangePlugins, this);
        this.handleDidChangePlugins();
    }

    get onDidUpdatePlugins(): Event<UpdatePluginsEvent> {
        return this.onDidUpdatePluginsEmitter.event;
    }

    async getPlugins(): Promise<PluginDescriptor[]> {
        return Array.from(
            this.getHostedPluginSupportContributions(),
            ([, contributions]) => this.getPluginDescriptor(contributions)
        );
    }

    async getPlugin(pluginUri: string): Promise<PluginDescriptor | undefined> {
        const id = this.pluginUri.parse(pluginUri)?.id;
        if (!id) {
            return;
        }
        let found; for (const [contributionId, contributions] of this.getHostedPluginSupportContributions()) {
            if (contributionId === id) {
                found = contributions;
                break;
            }
        }
        if (!found) {
            return;
        }
        return this.getPluginDescriptor(found);
    }

    enablePlugin(pluginUri: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    disablePlugin(pluginUri: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    uninstallPlugin(pluginUri: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    protected handleDidChangePlugins(): void {
        const event: UpdatePluginsEvent = {};
        const newUpdatePluginsEvent = new Set<string>();
        // Iter over all contributed plugins and remove items from the last set.
        for (const [, contributions] of this.getHostedPluginSupportContributions()) {
            const pluginUri = this.getPluginUri(contributions);
            event[pluginUri] = this.getPluginDescriptor(contributions);
            // Move seen pluginUris from the last set to the new one.
            this.lastUpdatePluginsEvent.delete(pluginUri);
            newUpdatePluginsEvent.add(pluginUri);
        }
        // Iter over all remaining plugin URIs from the last set:
        // Those were not seen again, it must mean they got removed.
        for (const [pluginUri] of this.lastUpdatePluginsEvent) {
            event[pluginUri] = null;
        }
        this.lastUpdatePluginsEvent = newUpdatePluginsEvent;
        this.onDidUpdatePluginsEmitter.fire(event);
    }

    protected getPluginUri(contributions: PluginContributions): string {
        return this.pluginUri.create({
            type: contributions.plugin.metadata.model.engine.type,
            id: PluginIdentifiers.componentsToUnversionedId(contributions.plugin.metadata.model)
        });
    }

    protected getPluginDescriptor(contributions: PluginContributions): PluginDescriptor {
        return {
            type: contributions.plugin.metadata.model.engine.type,
            id: contributions.plugin.metadata.model.id,
            builtin: contributions.plugin.type === PluginType.System,
            enabled: this.isPluginEnabled(contributions),
            installed: true,
            loaded: this.isPluginLoaded(contributions),
            busy: this.getPluginTransition(contributions),
        };
    }

    protected isPluginEnabled(contributions: PluginContributions): boolean {
        return contributions.state === PluginContributions.State.STARTED;
    }

    protected isPluginLoaded(contributions: PluginContributions): boolean {
        return (
            contributions.state === PluginContributions.State.LOADED ||
            contributions.state === PluginContributions.State.STARTING ||
            contributions.state === PluginContributions.State.STARTED
        );
    }

    protected getPluginTransition(contributions: PluginContributions): Plugin.Transition {
        // erk
        switch (contributions.state) {
            case PluginContributions.State.INITIALIZING:
            case PluginContributions.State.LOADING:
                return Plugin.Transition.Busy;
            case PluginContributions.State.STARTING:
                return Plugin.Transition.Enabling;
            case PluginContributions.State.LOADED:
            case PluginContributions.State.STARTED:
                return Plugin.Transition.None;
            default:
                console.debug('unhandled state:', contributions.state);
                return Plugin.Transition.Busy;
        }
    }

    protected getHostedPluginSupportContributions(): Map<PluginIdentifiers.UnversionedId, PluginContributions> {
        return this.hostedPluginSupport['contributions'];
    }
}
