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

import React = require('@theia/core/shared/react');
import { codicon, open, OpenerService, TooltipService, TreeWidget } from '@theia/core/lib/browser';
import { TreeElement } from '@theia/core/lib/browser/source-tree';
import URI from '@theia/core/lib/common/uri';
import { VSXExtensionNamespaceAccess, VSXUser } from '@theia/ovsx-client/lib/ovsx-types';
import { Plugin } from '@theia/plugin-registry/lib/common/plugin';
import { VsxExtensionAction } from './vsx-extension-action';

export const NUMBER_SHORT_COMPACT_FORMAT = new Intl.NumberFormat('en-US', {
    // Note: typescript@4.5.5 doesn't know about `compactDisplay: string` for some reason?
    compactDisplay: 'short',
    notation: 'compact'
} as Intl.NumberFormatOptions);

/** Ensure the version is prefixed by `v`. */
export function defaultVersionFormatter(version: string): string {
    return version.startsWith('v') ? version : 'v' + version;
}

/** Display is short format like '100', '10K', '1M', ... */
export function defaultDownloadCountFormatter(downloadCount: number): string {
    return NUMBER_SHORT_COMPACT_FORMAT.format(downloadCount);
}

/** Display floats in 0.5 increments. */
export function defaultAverageRatingFormatter(averageRating: number): string {
    return (Math.round(averageRating * 2) / 2).toString(10);
}

export interface VsxExtensionData {
    name: string;
    version: string;
    displayName: string;
    downloadUrl: string;
    preview: boolean;
    namespaceAccess: VSXExtensionNamespaceAccess;
    publishedBy: VSXUser;
    iconUrl?: string;
    publisher?: string;
    description?: string;
    averageRating?: number;
    downloadCount?: number;
    readmeUrl?: string;
    licenseUrl?: string;
    repository?: string;
    license?: string;
    readme?: string;
}

export class VsxExtensionTreeElement implements TreeElement {

    visible?: boolean;

    constructor(
        protected plugin: Plugin,
        protected vsxExtensionData: VsxExtensionData,
        protected tooltip: string,
        protected openerService: OpenerService,
        protected tooltipService: TooltipService
    ) { }

    get id(): string | number | undefined {
        return this.plugin.id;
    }

    async open(): Promise<void> {
        await open(this.openerService, new URI(this.plugin.id));
    }

    render(host: TreeWidget): React.ReactNode {
        return <VsxExtensionTreeElement.ReactComponent
            tree={host}
            treeElementId={this.id}
            plugin={this.plugin}
            vsxExtensionData={this.vsxExtensionData}
            tooltipService={this.tooltipService}
            tooltip={this.tooltip}
            downloadCountFormatter={defaultDownloadCountFormatter}
            averageRatingFormatter={defaultAverageRatingFormatter}
            versionFormatter={defaultVersionFormatter}
            openContextMenu={() => { }}
            reloadWindow={() => { }}
        />;
    }
}

export namespace VsxExtensionTreeElement {

    export interface ReactProps {
        /** TreeWidget hosting this TreeElement */
        tree: TreeWidget
        /** Unique id of the current TreeElement */
        treeElementId: string | number | undefined;
        plugin: Plugin
        vsxExtensionData: VsxExtensionData
        tooltipService: TooltipService
        tooltip: string
        downloadCountFormatter(downloadCount: number): string
        averageRatingFormatter(averageRating: number): string
        versionFormatter(version: string): string
        openContextMenu(): void
        reloadWindow(): void
    }

    export function ReactComponent(props: ReactProps): JSX.Element {
        let downloadCount;
        if (props.vsxExtensionData.downloadCount) {
            downloadCount = <span className='download-count'><i className={codicon('cloud-download')} />{props.downloadCountFormatter(props.vsxExtensionData.downloadCount)}</span>;
        }
        let averageRating;
        if (props.vsxExtensionData.averageRating) {
            averageRating = <span className='average-rating'><i className={codicon('star-full')} />{props.averageRatingFormatter(props.vsxExtensionData.averageRating)}</span>;
        }
        const tooltipAttributes = React.useMemo(
            () => props.tooltipService.getHtmlAttributes(props.tooltip),
            [props.tooltip]
        );
        return <div className='theia-vsx-extension noselect' {...tooltipAttributes}>
            {props.vsxExtensionData.iconUrl
                ? <img className='theia-vsx-extension-icon' src={props.vsxExtensionData.iconUrl} />
                : <div className='theia-vsx-extension-icon placeholder' />
            }
            <div className='theia-vsx-extension-content'>
                <div className='title'>
                    <div className='noWrapInfo'>
                        <span className='name'>{props.vsxExtensionData.displayName}</span> <span className='version'>{props.versionFormatter(props.vsxExtensionData.version)}</span>
                    </div>
                    <div className='stat'>
                        {downloadCount}
                        {averageRating}
                    </div>
                </div>
                <div className='noWrapInfo theia-vsx-extension-description'>{props.vsxExtensionData.description}</div>
                <div className='theia-vsx-extension-action-bar'>
                    <span className='noWrapInfo theia-vsx-extension-publisher'>{props.vsxExtensionData.publisher}</span>
                    <VsxExtensionAction.ReactComponent
                        tree={props.tree}
                        treeElementId={props.treeElementId}
                        plugin={props.plugin}
                        openContextMenu={props.openContextMenu}
                        reloadWindow={props.reloadWindow}
                    />
                </div>
            </div>
        </div>;
    }
}
