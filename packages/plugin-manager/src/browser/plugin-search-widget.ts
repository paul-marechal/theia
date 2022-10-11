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
import { codicon, Message, PanelLayout, ViewContainer } from '@theia/core/lib/browser';
import { nls } from '@theia/core';
import { PluginSearchBarWidget } from './plugin-search-bar-widget';
import { PluginSearchState } from './plugin-search-state';

@injectable()
export class PluginSearchWidget extends ViewContainer {

    static ID = 'plugin-search-widget';
    static LABEL = nls.localizeByDefault('Extensions');

    override disableDNDBetweenContainers = false;

    @inject(PluginSearchState)
    protected searchState: PluginSearchState;

    @inject(PluginSearchBarWidget)
    protected searchBar: PluginSearchBarWidget;

    @postConstruct()
    protected override init(): void {
        super.init();
        this.id = PluginSearchWidget.ID;
        this.addClass('theia-vsx-extensions-view-container');
        this.setTitleOptions({
            label: PluginSearchWidget.LABEL,
            iconClass: codicon('extensions'),
            closeable: true
        });
    }

    protected override onActivateRequest(msg: Message): void {
        this.searchBar.activate();
    }

    protected override configureLayout(layout: PanelLayout): void {
        layout.addWidget(this.searchBar);
        super.configureLayout(layout);
    }
}
