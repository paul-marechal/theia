/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from 'inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { GitResourceResolver, GIT_RESOURCE_SCHEME } from '../git-resource';
import { Workspace, TextDocument } from '@theia/languages/lib/common';
import URI from '@theia/core/lib/common/uri';
import { DirtyDiffComputer, DirtyDiff } from './diff-computer';
import { Emitter, Event } from '@theia/core';

@injectable()
export class DirtyDiffManager {

    protected readonly models = new Map<string, DirtyDiffModel>();
    protected readonly dirtyDiffComputer = new DirtyDiffComputer();

    protected readonly onDityDiffUpdateEmitter = new Emitter<DityDiffUpdate>();
    readonly onDityDiffUpdate: Event<DityDiffUpdate> = this.onDityDiffUpdateEmitter.event;

    constructor(
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(GitResourceResolver) protected readonly gitResourceResolver: GitResourceResolver,
        @inject(Workspace) protected readonly workspace: Workspace,
    ) { }

    initialize() {
        this.workspace.onDidCloseTextDocument(document => this.removeModel(document.uri));
        this.workspace.onDidOpenTextDocument(async document => {
            const model = await this.addModel(document);
            if (model) {
                this.documentChanged(document);
            }
        });
        this.workspace.onDidChangeTextDocument(params => {
            const document = this.workspace.textDocuments.find(d => d.uri === params.textDocument.uri);
            if (document) {
                this.documentChanged(document);
            }
        });
    }

    protected removeModel(uri: string) {
        this.models.delete(uri);
    }

    protected async addModel(textDocument: TextDocument): Promise<DirtyDiffModel | undefined> {
        const uri = new URI(textDocument.uri);
        if (this.isUnderVersionControl(uri)) {
            const dirtyDiffModel = await this.createModel(uri);
            this.models.set(textDocument.uri, dirtyDiffModel);
            return dirtyDiffModel;
        }
        return undefined;
    }

    protected documentChanged(textDocument: TextDocument) {
        if (this.isEditorVisible(textDocument.uri)) {
            this.updateDirtyDiffModel(textDocument);
        }
    }

    protected async isEditorVisible(uri: string): Promise<boolean> {
        const editor = await this.editorManager.getByUri(new URI(uri));
        return !!editor && editor.isVisible;
    }

    protected async isUnderVersionControl(uri: URI): Promise<boolean> {
        const repository = await this.gitResourceResolver.getRepository(uri);
        return !!repository;
    }

    protected async createModel(uri: URI): Promise<DirtyDiffModel> {
        const gitResource = await this.gitResourceResolver.getResource(uri.withScheme(GIT_RESOURCE_SCHEME));
        const previousContents = await gitResource.readContents();
        const previous = previousContents.split(/\r\n|\n/);
        // TOOD start small, but model should be updated on changes of git resource!
        const dirtyDiffModel = <DirtyDiffModel>{ uri, previous };
        return dirtyDiffModel;
    }

    protected updateDirtyDiffModel(document: TextDocument) {
        const uri = document.uri;
        const model = this.models.get(uri);
        if (!model) {
            return;
        }
        const previous = model.previous;
        const currentContents = document.getText();
        const current = currentContents.split(/\r\n|\n/);
        const dirtyDiff = this.dirtyDiffComputer.computeDirtyDiff(previous, current);
        const dirtyDiffUpdate = <DityDiffUpdate>{ uri, ...dirtyDiff };
        this.onDityDiffUpdateEmitter.fire(dirtyDiffUpdate);
    }

}

export interface DirtyDiffModel {
    readonly uri: URI;
    previous: string[];
}

export interface DityDiffUpdate extends DirtyDiff {
    readonly uri: string;
}
