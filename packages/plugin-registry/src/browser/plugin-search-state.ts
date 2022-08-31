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
import { inject, injectable, interfaces } from '@theia/core/shared/inversify';
import { PluginQuery, PluginQueryParser } from '../common/plugin-query';

export const PluginSearchState = Symbol('PluginSearchState') as symbol & interfaces.Abstract<PluginSearchState>;
export interface PluginSearchState {
    readonly query: PluginQuery;
    onDidChangeQuery: Event<PluginQuery>;
    setQuery(query: string): PluginQuery;
    saveState(): unknown;
    loadState(serialized: unknown): this;
}

@injectable()
export class DefaultPluginSearchState implements PluginSearchState {

    query: PluginQuery = {
        fullQuery: '',
        query: '',
        modifiers: []
    };

    protected onDidChangeQueryEmitter = new Emitter<PluginQuery>();

    @inject(PluginQueryParser)
    protected queryParser: PluginQueryParser;

    get onDidChangeQuery(): Event<PluginQuery> {
        return this.onDidChangeQueryEmitter.event;
    }

    setQuery(query: string): PluginQuery {
        if (query !== this.query.fullQuery) {
            this.query = this.queryParser.parsePluginQuery(query);
            this.onDidChangeQueryEmitter.fire(this.query);
        }
        return this.query;
    }

    saveState(): unknown {
        return {
            query: this.query.fullQuery
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadState(serialized: any): this {
        // eslint-disable-next-line no-null/no-null
        if (typeof serialized === 'object' && serialized !== null && typeof serialized.query === 'string') {
            this.setQuery(serialized.query);
        } else {
            console.trace('state not loaded: invalid serialized data:', serialized);
        }
        return this;
    }
}
