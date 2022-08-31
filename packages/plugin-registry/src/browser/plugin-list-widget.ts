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
import { SourceTreeWidget } from '@theia/core/lib/browser/source-tree';
import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { BadgeWidget } from '@theia/core/lib/browser';

@injectable()
export class PluginListWidget extends SourceTreeWidget implements BadgeWidget {

    protected _badge?: number;
    protected onDidChangeBadgeEmitter = new Emitter<void>();

    @postConstruct()
    protected override init(): void {
        super.init();
        this.addClass('theia-vsx-extensions');
    }

    get onDidChangeBadge(): Event<void> {
        return this.onDidChangeBadgeEmitter.event;
    }

    get badge(): number | undefined {
        return this._badge;
    }

    set badge(value: number | undefined) {
        if (this._badge !== value) {
            this._badge = value;
            this.onDidChangeBadgeEmitter.fire();
        }
    }
}
