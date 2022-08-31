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

import { Disposable, DisposableCollection, Emitter, Event } from '@theia/core';

export interface Plugin {
    readonly id: string;
    readonly type: Plugin.Type;
    readonly busy: Plugin.Transition;
    readonly installed: boolean;
    /**
     * When a plugin is loaded, it can always be enabled/disabled.
     */
    readonly loaded: boolean;
    readonly enabled: boolean;
    onDidChangePlugin: Event<void>;
}

export interface BuiltinPlugin {
    readonly builtinVersion: string;
}

export interface UserPlugin {
    readonly availableVersions: string[];
    onDidChangeAvailableVersions: Event<void>;
}

export interface LoadedPlugin {
    readonly loadedVersion: string;
}

export interface UninstalledPlugin {
    install(version: string): Promise<void>;
}

export interface InstalledPlugin {
    readonly installedVersion: string;
    update(version: string): Promise<void>;
    uninstall(): Promise<void>;
}

export interface EnabledPlugin {
    disable(): Promise<void>;
}

export interface DisabledPlugin {
    enable(): Promise<void>;
}

/**
 * Utility class to quickly implement a plugin handle.
 */
export abstract class AbstractPlugin implements Plugin, BuiltinPlugin, UserPlugin, LoadedPlugin, InstalledPlugin, UninstalledPlugin, EnabledPlugin, DisabledPlugin, Disposable {

    abstract id: string;
    abstract type: Plugin.Type;
    abstract busy: Plugin.Transition;
    abstract installed: boolean;
    abstract loaded: boolean;
    abstract enabled: boolean;

    abstract install(version: string): Promise<void>;
    abstract update(version: string): Promise<void>;
    abstract uninstall(): Promise<void>;
    abstract disable(): Promise<void>;
    abstract enable(): Promise<void>;

    protected _builtinVersion?: string;
    protected _loadedVersion?: string;
    protected _installedVersion?: string;
    protected _availableVersions?: string;

    protected disposables = new DisposableCollection();
    protected onDidChangePluginEmitter = this.disposables.pushThru(new Emitter<void>());
    protected onDidChangeAvailableVersionsEmitter = this.disposables.pushThru(new Emitter<void>());

    get onDidChangePlugin(): Event<void> {
        return this.onDidChangePluginEmitter.event;
    }

    get onDidChangeAvailableVersions(): Event<void> {
        return this.onDidChangeAvailableVersionsEmitter.event;
    }

    @CheckedGetSet(Plugin.isBuiltin, 'plugin must be a builtin to get/set this value')
    builtinVersion: string;

    @CheckedGetSet(Plugin.isUser, 'plugin must be installed to get/set this value')
    availableVersions: string[];

    @CheckedGetSet(Plugin.isLoaded, 'plugin must be loaded to get/set this value')
    loadedVersion: string;

    @CheckedGetSet(Plugin.isInstalled, 'plugin must be installed to get/set this value')
    installedVersion: string;

    dispose(): void {
        this.busy = Plugin.Transition.None;
        this.installed = false;
        this.loaded = false;
        this.enabled = false;
        this.disposables.dispose();
    }
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

    export function isBuiltin(plugin: Plugin): plugin is Plugin & BuiltinPlugin {
        return plugin.type === Type.Builtin;
    }

    export function isUser(plugin: Plugin): plugin is Plugin & UserPlugin {
        return plugin.type === Type.User;
    }

    export function isLoaded(plugin: Plugin): plugin is Plugin & LoadedPlugin {
        return plugin.loaded;
    }

    /**
     * Note that builtin plugins aren't technically instances of
     * {@link UninstalledPlugin}: This interface/state represents plugins that
     * can be installed, which builtins can't be.
     */
    export function isUninstalled(plugin: Plugin): plugin is Plugin & UninstalledPlugin {
        return plugin.type !== Type.Builtin && !plugin.installed;
    }

    /**
     * Note that builtin plugins aren't technically instances of
     * {@link InstalledPlugin}: This interface/state represents plugins that
     * can be updated or uninstalled, which builtins can't be.
     */
    export function isInstalled(plugin: Plugin): plugin is Plugin & InstalledPlugin {
        return plugin.type !== Type.Builtin && plugin.installed;
    }

    export function isEnabled(plugin: Plugin): plugin is Plugin & EnabledPlugin {
        return plugin.enabled;
    }

    export function isDisabled(plugin: Plugin): plugin is Plugin & DisabledPlugin {
        return !plugin.enabled;
    }

    export function getVersion(plugin: Plugin): string | undefined {
        if (isBuiltin(plugin)) {
            return plugin.builtinVersion;
        } else if (isLoaded(plugin)) {
            return plugin.loadedVersion;
        } else if (isInstalled(plugin)) {
            return plugin.installedVersion;
        }
    }
}

/**
 * Run the predicate function before getting/setting the field and throw if
 * the predicate returns a falsy-value.
 */
export function CheckedGetSet<T>(predicate: (self: T, hiddenField: string) => unknown, message: string): (target: T, propertyKey: string | symbol) => void {
    return (target, propertyKey) => {
        if (typeof propertyKey !== 'string') {
            throw new TypeError('not a string property!');
        }
        const hiddenField = '_' + propertyKey;
        Object.defineProperty(target, propertyKey, {
            enumerable: true,
            get(): unknown {
                if (!predicate(this, hiddenField)) {
                    throw new TypeError(message);
                }
                return this[hiddenField];
            },
            set(value: unknown): void {
                if (!predicate(this, hiddenField)) {
                    throw new TypeError(message);
                }
                this[hiddenField] = value;
            }
        });
    };
}
