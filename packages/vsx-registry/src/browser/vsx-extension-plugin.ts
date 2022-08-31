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

import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { AbstractPlugin, Plugin } from '@theia/plugin-registry/lib/common/plugin';

export interface VsxExtensionPlugin extends Plugin {

}

export type PluginTransitionResult = [error: Error | undefined, state: Plugin.State];

export interface PluginManager {
    getAll(): Plugin[];
    get(id: string): Plugin | undefined;
    has(id: string): boolean;
    install(id: string, version: string): Promise<PluginTransitionResult>;
    update(id: string, version: string): Promise<PluginTransitionResult>;
    enable(id: string): Promise<PluginTransitionResult>;
    disable(id: string): Promise<PluginTransitionResult>;
    uninstall(id: string): Promise<PluginTransitionResult>;
}

@injectable()
export class VsxPluginManager {

    protected plugins = new Map<string, Plugin>();

    @inject(HostedPluginSupport)
    protected pluginSupport: HostedPluginSupport;

    @postConstruct()
    protected postConstruct(): void {
        this.pluginSupport.onDidChangePlugins(() => this.updatePlugins());
        this.updatePlugins();
    }

    protected updatePlugins(): void {
        this.pluginSupport.plugins.forEach(plugin => {
            // plugin.outOfSync ???????????
        });
    }
}

export class VsxExtensionPluginImpl extends AbstractPlugin {

    constructor(
        public id: string,
        public type: Plugin.Type,
        public state: Plugin.State,
        protected pluginManager: PluginManager
    ) {
        super();
    }

    async install(version: string): Promise<void> {
        if (!Plugin.isUninstalled(this)) {
            throw new Error('illegal state');
        }
        this.setAndEmitState(Plugin.State.Installing);
        const [, state] = await this.pluginManager.install(this.id, version);
        this.setAndEmitState(state);
    }

    async update(version: string): Promise<void> {
        if (!Plugin.isUser(this)) {
            throw new Error('illegal state');
        }
        this.setAndEmitState(Plugin.State.Updating);
        const [, state] = await this.pluginManager.update(this.id, version);
        this.setAndEmitState(state);
    }

    async uninstall(): Promise<void> {
        if (!Plugin.isInstalled(this)) {
            throw new Error('illegal state');
        }
        this.setAndEmitState(Plugin.State.Uninstalling);
        const [, state] = await this.pluginManager.uninstall(this.id);
        this.setAndEmitState(state);
    }

    async disable(): Promise<void> {
        if (!Plugin.isEnabled(this)) {
            throw new Error('illegal state');
        }
        this.setAndEmitState(Plugin.State.Disabling);
        const [, state] = await this.pluginManager.disable(this.id);
        this.setAndEmitState(state);
    }

    async enable(): Promise<void> {
        if (!Plugin.isDisabled(this)) {
            throw new Error('illegal state');
        }
        this.setAndEmitState(Plugin.State.Enabling);
        const [, state] = await this.pluginManager.enable(this.id);
        this.setAndEmitState(state);
    }
}
