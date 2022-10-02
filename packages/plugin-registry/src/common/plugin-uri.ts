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

import URI from '@theia/core/lib/common/uri';

/**
 * @examples
 *
 * plugin:vscode/pluginId
 * plugin:vscode/pluginId@1.2.3
 */
export namespace PluginUri {

    export interface Info {
        type: string
        id: string
        version?: string
        provider?: string
    }

    export function is(uriOrString: URI | string): uriOrString is URI {
        const uri = typeof uriOrString === 'object' ? uriOrString : new URI(uriOrString);
        return uri.scheme === 'plugin';
    }

    export function create(info: Info): URI {
        let path = '/' + info.type + '/' + info.id;
        if (info.version) {
            path += '@' + info.version;
        }
        return new URI()
            .withScheme('plugin')
            .withPath(path);
    }

    export function parse(uriOrString: URI | string): Info | undefined {
        if (!is(uriOrString)) { return; }
        const match = /^\/([A-Za-z0-9_-.]+)\/([A-Za-z0-9_-.]+)(@\S+)?\/?$/i.exec(uriOrString.path.toString());
        if (!match) { return; }
        const [, type, id, version] = match;
        return { type, id, version };
    }

    /**
     * @returns the radical plugin URI such as `plugin:/type/pluginId`.
     */
    export function radical(uri: URI): URI | undefined;
    export function radical(uri: string): string | undefined;
    export function radical(uriOrString: URI | string): URI | string | undefined {
        const info = parse(uriOrString);
        if (!info) { return; }
        const { type, id } = info;
        const uri = create({ type, id });
        return typeof uriOrString === 'string'
            ? uri.toString(true)
            : uri;
    }
}
