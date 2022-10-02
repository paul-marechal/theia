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
import { nls } from '@theia/core';
import { TreeWidget } from '@theia/core/lib/browser';
import { InstalledPlugin, Plugin } from '@theia/plugin-registry/lib/common/plugin';

export namespace VsxExtensionAction {

    export interface Props {
        /** TreeWidget hosting this TreeElement */
        tree: TreeWidget
        /** Unique id of the current TreeElement */
        treeElementId: string | number | undefined;
        plugin: Plugin
        openContextMenu(): void
        reloadWindow(): void
    }

    export function ReactComponent(props: Props): JSX.Element {
        let tabIndex;
        const focusedTreeElementId = props.tree.model.getFocusedNode()?.id;
        if (focusedTreeElementId !== undefined && props.treeElementId !== undefined && focusedTreeElementId === props.treeElementId) {
            tabIndex = 0;
        }
        // We need to refresh this component on plugin.state updates,
        // this is the only kind of hook available to notify React.
        // Note: NaN === NaN returns false, hence why we use it.
        const refresh = React.useState(NaN)[1];
        React.useEffect(() => {
            const listener = props.plugin.onDidChangePlugin(() => refresh(NaN));
            return () => listener.dispose();
        });
        React.useEffect(() => {
            const listener = props.tree.model.onSelectionChanged(() => refresh(NaN));
            return () => listener.dispose();
        });
        if (Plugin.isTransitioning(props.plugin)) {
            if (props.plugin.busy === Plugin.Transition.Uninstalling) {
                return <button className="theia-button action theia-mod-disabled">{nls.localizeByDefault('Uninstalling')}</button>;
            } else {
                let text;
                if (props.plugin.busy === Plugin.Transition.Installing) {
                    text = nls.localizeByDefault('Installing');
                } else {
                    text = 'Busy...';
                }
                return <button className="theia-button action prominent theia-mod-disabled">{text}</button>;
            }
        } else if (Plugin.isBuiltin(props.plugin)) {
            return <div className="codicon codicon-settings-gear action" tabIndex={tabIndex} onClick={props.openContextMenu}></div>;
        } else if (Plugin.isInstalled(props.plugin)) {
            const outOfSync = false;
            const uninstall = () => (props.plugin as Plugin & InstalledPlugin).uninstall();
            return <div>
                {outOfSync
                    ? <button className="theia-button action" onClick={props.reloadWindow}>{nls.localizeByDefault('Reload Required')}</button>
                    : <button className="theia-button action" onClick={uninstall}>{nls.localizeByDefault('Uninstall')}</button>
                }
                <div className="codicon codicon-settings-gear action" onClick={props.openContextMenu}></div>
            </div>;
        }
        return <span>An error occured...</span>;
    }
}
