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
import { Plugin } from '../common/plugin';
// import { PluginManager } from '../common/plugin-manager';

@injectable()
export class HostedPluginManager {

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

    getAll(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    get(id: string): Plugin | undefined {
        return this.plugins.get(id);
    }

    has(id: string): boolean {
        return this.plugins.has(id);
    }
}
