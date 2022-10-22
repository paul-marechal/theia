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
import URI from '@theia/core/lib/common/uri';
import { interfaces } from '@theia/core/shared/inversify';
import { Plugin } from '../common/plugin';

export interface PluginDescriptor {
    type: string;
    id: string;
    builtin: boolean;
    installed: boolean;
    loaded: boolean;
    enabled: boolean;
    busy: Plugin.Transition;
}

export interface UpdatePluginsEvent {
    [pluginUri: string]: PluginDescriptor | null;
}

export interface ProvidedPlugin {
    provider: PluginProvider;
    plugin: PluginDescriptor;
}

export interface ProvidedPlugins {
    provider: PluginProvider;
    plugins: PluginDescriptor[];
}

export interface ReducedPlugins {
    [pluginUri: string]: ProvidedPlugin;
}

/**
 * The plugin manager is the main API to list known plugins from various sources.
 *
 * The plugin manager is responsible for collecting data about plugins and exposing
 * their state through the {@link Plugin} interface for each entry.
 */
export const PluginManager = Symbol('PluginManager') as symbol & interfaces.Abstract<PluginManager>;
export interface PluginManager {
    onDidAddPlugin: Event<Plugin>;
    onDidRemovePlugin: Event<string>;
    getPlugins(): Promise<Plugin[]>;
    getPlugin(pluginUri: URI | string): Promise<Plugin | undefined>;
}

/**
 * The plugin reducer is the component that will resolve conflicts between duplicated
 * plugin entries provided by the different sources.
 *
 * You may rebind this component in your application.
 */
export const PluginReducer = Symbol('PluginReducer') as symbol & interfaces.Abstract<PluginReducer>;
export interface PluginReducer {
    reducePlugins(plugins: ProvidedPlugins[]): Promise<ReducedPlugins>;
}

export const PluginProvider = Symbol('PluginProvider') as symbol & interfaces.Abstract<PluginProvider>;
export interface PluginProvider {
    onDidUpdatePlugins: Event<UpdatePluginsEvent>;
    getPlugins(): Promise<PluginDescriptor[]>;
    getPlugin(pluginUri: string): Promise<PluginDescriptor | undefined>;
    enablePlugin(pluginUri: string): Promise<void>;
    disablePlugin(pluginUri: string): Promise<void>;
    uninstallPlugin(pluginUri: string): Promise<void>;
}
