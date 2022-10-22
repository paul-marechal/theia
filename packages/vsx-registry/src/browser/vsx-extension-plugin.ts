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

// import { AbstractPlugin, Plugin } from '@theia/plugin-manager/lib/common/plugin';
// import { PluginManager } from '@theia/plugin-manager/lib/common/plugin-manager';

// export interface VsxExtensionPlugin extends Plugin {

// }

// export class VsxExtensionPluginImpl extends AbstractPlugin {

//     constructor(
//         public id: string,
//         public type: Plugin.Type,
//         public busy: Plugin.Transition,
//         public loaded: boolean,
//         public installed: boolean,
//         public enabled: boolean,
//         protected pluginManager: PluginManager
//     ) {
//         super();
//     }

//     async install(version: string): Promise<void> {
//         if (!Plugin.isUninstalled(this)) {
//             throw new Error('illegal state');
//         }
//         this.setBusy(Plugin.Transition.Installing);
//         await this.pluginManager.install(this.id, version);
//         this.loaded = true;
//         this.installed = true;
//         this.resetBusy();
//     }

//     async update(version: string): Promise<void> {
//         if (!Plugin.isUser(this)) {
//             throw new Error('illegal state');
//         }
//         this.setBusy(Plugin.Transition.Updating);
//         await this.pluginManager.update(this.id, version);
//         this.resetBusy();
//     }

//     async uninstall(): Promise<void> {
//         if (!Plugin.isInstalled(this)) {
//             throw new Error('illegal state');
//         }
//         this.setBusy(Plugin.Transition.Uninstalling);
//         await this.pluginManager.uninstall(this.id);
//         this.installed = false;
//         this.resetBusy();
//     }

//     async disable(): Promise<void> {
//         if (!Plugin.isEnabled(this)) {
//             throw new Error('illegal state');
//         }
//         this.setBusy(Plugin.Transition.Disabling);
//         await this.pluginManager.disable(this.id);
//         this.enabled = false;
//         this.resetBusy();
//     }

//     async enable(): Promise<void> {
//         if (!Plugin.isDisabled(this)) {
//             throw new Error('illegal state');
//         }
//         this.setBusy(Plugin.Transition.Enabling);
//         await this.pluginManager.enable(this.id);
//         this.enabled = true;
//         this.resetBusy();
//     }
// }
