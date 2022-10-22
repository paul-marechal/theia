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

import { classImplements } from '@theia/core/lib/common/decorators';
import URI from '@theia/core/lib/common/uri';
import { interfaces } from '@theia/core/shared/inversify';

export interface PluginUriComponents {
    /**
     * e.g. `theia`, `vscode`, etc.
     */
    type: string;
    /**
     * In case the plugin type has the concept of `publisher` it should be part
     * of the `id` here.
     */
    id: string;
    version?: string;
    provider?: string;
}

/**
 * @example
 *
 * 'theia-plugin:/vscode/pluginId'
 * 'theia-plugin:/vscode/pluginId@1.2.3'
 */
export const PluginUri = Symbol('PluginUri') as symbol & interfaces.Abstract<PluginUri>;
export interface PluginUri {
    readonly scheme: string;
    create(components: PluginUriComponents): string;
    is(uri: URI | string): boolean;
    parse(uri: URI | string): PluginUriComponents | undefined;
    /**
     * @returns the radical plugin URI such as `plugin-scheme:/pluginType/pluginId`.
     */
    radical(uri: URI | string): string | undefined;
}

@classImplements<PluginUri>()
export class DefaultPluginUri {

    static scheme = 'theia-plugin';

    static is(uriOrString: URI | string): uriOrString is URI | string {
        const uri = typeof uriOrString === 'object' ? uriOrString : new URI(uriOrString);
        return uri.scheme === this.scheme;
    }

    static create(components: PluginUriComponents): string {
        let path = '/' + components.type + '/' + components.id;
        if (components.version) {
            path += '@' + components.version;
        }
        return new URI()
            .withScheme(this.scheme)
            .withPath(path)
            .toString(true);
    }

    static parse(uriOrString: URI | string): PluginUriComponents | undefined {
        if (!this.is(uriOrString)) {
            return;
        }
        const uri = typeof uriOrString === 'object' ? uriOrString : new URI(uriOrString);
        const match = /^\/([A-Za-z0-9_-.]+)\/([A-Za-z0-9_-.]+)(@\S+)?\/?$/i.exec(uri.path.toString());
        if (!match) {
            return;
        }
        const [, type, id, version] = match;
        return { type, id, version };
    }

    static radical(uriOrString: URI | string): string | undefined {
        const components = this.parse(uriOrString);
        if (!components) {
            return;
        }
        const { type, id } = components;
        return this.create({ type, id });
    }
}
