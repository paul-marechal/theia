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

import { nls } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { BaseWidget, Message } from '@theia/core/lib/browser';
import { PluginSearchState } from './plugin-search-state';
import { PluginQuery } from '../common/plugin-query';

@injectable()
export class PluginSearchBarWidget extends BaseWidget {

    static ID = 'theia.plugin-search-bar';

    protected input: HTMLInputElement;

    @inject(PluginSearchState)
    protected searchState: PluginSearchState;

    @postConstruct()
    protected init(): void {
        this.id = PluginSearchBarWidget.ID;
        this.addClass('theia-vsx-extensions-search-bar');
        this.initInput();
        this.initState();
    }

    protected initInput(): void {
        this.input = document.createElement('input');
        this.input.addEventListener('input', event => this.handleInputEvent(event));
        this.input.className = 'theia-input';
        // eslint-disable-next-line @theia/localization-check
        this.input.placeholder = nls.localize('theia/plugin-registry/searchPlaceholder', 'Search Extensions');
        this.input.spellcheck = false;
        this.node.appendChild(this.input);
    }

    protected initState(): void {
        this.input.value = this.searchState.query.fullQuery;
        this.searchState.onDidChangeQuery(query => this.handleDidChangeQuery(query), undefined, this.toDispose);
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.input.focus();
    }

    protected handleInputEvent({ target }: Event): void {
        if (target instanceof HTMLInputElement) {
            this.searchState.setQuery(target.value);
        }
    }

    protected handleDidChangeQuery(query: PluginQuery): void {
        // Prevent feedback-loops such as:
        //  1. Input changes
        //  2. State's query is updated
        //  3. onDidChangeQuery is fired
        //  4. This listener is triggered and updates the input again
        if (query.fullQuery !== this.input.value) {
            this.input.value = query.fullQuery;
        }
    }
}
