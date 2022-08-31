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
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { Plugin } from '@theia/plugin-registry/lib/common/plugin';

@injectable()
export class VsxExtensionsState {

    protected onDidChangeEmitter = new Emitter<void>();
    protected pluginCache = new Map<string, Plugin>();
    protected installed = new WeakSet<Plugin>();
    protected builtin = new WeakSet<Plugin>();

    @inject(HostedPluginSupport)
    protected pluginSupport: HostedPluginSupport;

    @postConstruct()
    protected postConstruct(): void {
        this.pluginSupport.onDidChangePlugins(() => this.updateInstalled());
        this.updateInstalled();
    }

    get onDidChange(): Event<void> {
        return this.onDidChangeEmitter.event;
    }

    protected updateInstalled(): void {
        this.installed = new WeakSet();
        this.pluginSupport.plugins.forEach(plugin => {
            if (plugin.model.engine.type === 'vscode') {
                // const { id, version } = plugin.model;
                // this.installed.add(id);
            }
        });
    }
}
