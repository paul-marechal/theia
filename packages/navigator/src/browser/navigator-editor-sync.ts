/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject, postConstruct } from "inversify";
import { EditorManager, EditorWidget } from '@theia/editor/lib/browser';
import { Disposable } from '@theia/core/lib/common';
import { ITreeNode, ISelectableTreeNode, IExpandableTreeNode } from "@theia/core/lib/browser";
import { FileNavigatorModel } from "./navigator-model";
import { NavigatorPreferences } from "./navigator-preferences";

@injectable()
export class NavigatorEditorSynchronizer {

    protected activeEditorChangedSubscription: Disposable;

    constructor(
        @inject(FileNavigatorModel) protected readonly fileNavigatorModel: FileNavigatorModel,
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(NavigatorPreferences) protected readonly navigatorPreferences: NavigatorPreferences
    ) {

    }

    @postConstruct()
    protected async init() {
        await this.navigatorPreferences.ready;
        this.navigatorPreferences.onPreferenceChanged(preference => {
            if (preference.preferenceName === 'navigator.linkWithEditor') {
                if (preference.newValue) {
                    this.activeEditorChangedSubscription = this.editorManager.onActiveEditorChanged(this.onActiveEditorChangedHandler);
                } else {
                    this.activeEditorChangedSubscription.dispose();
                }
            }
        });
    }

    protected onActiveEditorChangedHandler(editor: EditorWidget | undefined) {
        if (editor) {
            this.selectNodeByEditor(editor);
        }
    }

    /**
     * Reveals and selects corresponding to given editor node in navigator.
     *
     * @param editor editor widget object to reveal its node in navigator
     */
    selectNodeByEditor(editor: EditorWidget) {
        this.selectNodeById(this.editorIdToNavigatorNodeId(editor.id));
    }

    /**
     * Converts editor id to navigator node id.
     * Example: 'code-editor-opener:file:///home/user/workspace/README.md' => 'file:///home/user/workspace/README.md'
     *
     * @param editorId id of editor tab
     * @returns id of corresponding navigator node
     */
    protected editorIdToNavigatorNodeId(editorId: string) {
        return editorId.substring(editorId.indexOf(':') + 1);
    }

    /**
     * Reveals and selects node in navigator by its id.
     * If node with given id doesn't exist, nothing happens.
     * Node id example: 'file:///home/user/workspace/README.md'
     *
     * @param nodeId navigator tree node id
     */
    selectNodeById(nodeId: string): void {
        let node = this.fileNavigatorModel.getNode(nodeId);
        if (node) {
            // node is mounted in the navigator tree
            if (ISelectableTreeNode.is(node)) {
                this.revealNode(node);
                this.fileNavigatorModel.selectNode(node);
            }
        } else {
            // node may exist, but hasn't mounted yet
            this.tryRevealNode(nodeId).then((targetNode: ITreeNode | undefined) => {
                if (targetNode && ISelectableTreeNode.is(targetNode)) {
                    // node exists and revealed in the navigator tree now
                    this.fileNavigatorModel.selectNode(targetNode);
                }
            });
        }
    }

    /**
     * Reveals given node in navigator.
     * This method should be used when given node already exist (but might be hidden) in the navigator tree.
     * Otherwise use this.tryRevealNode
     */
    protected revealNode(node: ITreeNode | undefined): void {
        if (node) {
            // cannot use ITreeNode.isVisible(node) here because it says that node is visible when it actually isn't
            if (!('visible' in node) || node.visible === false) {
                this.revealNode(node.parent);
            }

            if (IExpandableTreeNode.is(node) && !node.expanded) {
                this.fileNavigatorModel.expandNode(node);
            }
        }
    }

    /**
     * Tries to reveal node in navigator by id.
     * Node id example: 'file:///home/user/workspace/src/subdir/file.ts'
     *
     * @param nodeId Reveals node
     * @returns the node with given id if it exists, undefined otherwise
     */
    protected async tryRevealNode(nodeId: string): Promise<ITreeNode | undefined> {
        let rootNode = this.fileNavigatorModel.root;
        if (rootNode && nodeId.startsWith(rootNode.id)) {
            let segments = nodeId.substring(rootNode.id.length + 1).split('/');
            let currentNode: ITreeNode | undefined;
            let currentNodeId = rootNode.id;
            for (let segment of segments) {
                currentNode = this.fileNavigatorModel.getNode(currentNodeId);
                if (currentNode) {
                    if (IExpandableTreeNode.is(currentNode) && !currentNode.expanded) {
                        await this.expandNode(currentNode);
                    }
                    currentNodeId += '/' + segment;
                } else {
                    // node doesn't exist, path was wrong
                    return undefined;
                }
            }
            return this.fileNavigatorModel.getNode(currentNodeId);
        }
        return undefined;
    }

    protected expandNode(node: IExpandableTreeNode) {
        return new Promise(resolve => {
            // onExpansionChanged event doesn't work here because it is fired before actual expanding
            let subscribtion = this.fileNavigatorModel.onNodeRefreshed(expandedNode => {
                if (expandedNode.id === node.id) {
                    subscribtion.dispose();
                    resolve();
                }
            });
            this.fileNavigatorModel.expandNode(node);
        });
    }
}
