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

import { Event } from '@theia/core';

export interface Plugin {
    /**
     * e.g. `theia`, `vscode`, etc.
     */
    readonly type: string;
    /**
     * e.g. `publisherId.pluginId`.
     */
    readonly id: string;
    /**
     * If the plugin is currently busy a.k.a. going through transitions.
     */
    readonly busy: Plugin.Transition;
    /**
     * When a plugin is loaded, it can always be enabled/disabled.
     */
    readonly loaded: boolean;
    readonly builtin: boolean;
    readonly enabled: boolean;
    readonly installed: boolean;
    onDidChangePlugin: Event<void>;
}

export interface UninstalledPlugin {
    // install(version: string): Promise<void>;
}

export interface InstalledPlugin {
    uninstall(): Promise<void>;
}

export interface EnabledPlugin {
    disable(): Promise<void>;
}

export interface DisabledPlugin {
    enable(): Promise<void>;
}

export namespace Plugin {

    export enum Type {
        /**
         * Can only be enabled or disabled.
         */
        Builtin = 'builtin',
        /**
         * Can be installed, uninstalled, updated, enabled or disabled.
         */
        User = 'user'
    }

    export enum Transition {
        None = 0,
        /** Unknown transition state. */
        Busy,
        Installing,
        Uninstalling,
        Enabling,
        Disabling,
        Updating,
    }

    export function isTransitioning(plugin: Plugin): boolean {
        return plugin.busy !== Transition.None;
    }

    export function isBuiltin(plugin: Plugin): boolean {
        return plugin.builtin;
    }

    export function isUser(plugin: Plugin): boolean {
        return !plugin.builtin;
    }

    export function isLoaded(plugin: Plugin): boolean {
        return plugin.loaded;
    }

    /**
     * Note that builtin plugins aren't technically instances of
     * {@link UninstalledPlugin}: This interface/state represents plugins that
     * can be installed, which builtins can't be.
     */
    export function isUninstalled(plugin: Plugin): plugin is Plugin & UninstalledPlugin {
        return !isBuiltin(plugin) && !isTransitioning(plugin) && !plugin.installed;
    }

    /**
     * Note that builtin plugins aren't technically instances of
     * {@link InstalledPlugin}: This interface/state represents plugins that
     * can be updated or uninstalled, which builtins can't be.
     */
    export function isInstalled(plugin: Plugin): plugin is Plugin & InstalledPlugin {
        return !isBuiltin(plugin) && !isTransitioning(plugin) && plugin.installed;
    }

    export function isEnabled(plugin: Plugin): plugin is Plugin & EnabledPlugin {
        return !isTransitioning(plugin) && plugin.enabled;
    }

    export function isDisabled(plugin: Plugin): plugin is Plugin & DisabledPlugin {
        return !isTransitioning(plugin) && !plugin.enabled;
    }

    // export function getVersion(plugin: Plugin): string | undefined {
    //     if (isBuiltin(plugin)) {
    //         return plugin.builtinVersion;
    //     } else if (isLoaded(plugin)) {
    //         return plugin.loadedVersion;
    //     } else if (isInstalled(plugin)) {
    //         return plugin.installedVersion;
    //     }
    // }
}
