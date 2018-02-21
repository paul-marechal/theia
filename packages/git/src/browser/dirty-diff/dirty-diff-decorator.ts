/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable } from 'inversify';
import { EditorManager, EditorDecorationsService, EditorDecorationTypeProvider, DecorationType, Range, Position, DecorationOptions } from '@theia/editor/lib/browser';
import { DityDiffUpdate } from './dirty-diff-manager';
import { LineRange } from './diff-computer';

export enum DirtyDiffDecorationType {
    AddedLine = 'dirty-diff-added-line',
    RemovedLine = 'dirty-diff-removed-line',
    ModifiedLine = 'dirty-diff-modified-line',
}

const Type = DirtyDiffDecorationType;

@injectable()
export class DirtyDiffDecorator implements EditorDecorationTypeProvider {

    constructor(
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(EditorDecorationsService) protected readonly editorDecorationsService: EditorDecorationsService,
    ) { }

    get(): DecorationType[] {
        return [
            {
                type: Type.AddedLine,
                isWholeLine: true,
                borderStyle: 'solid',
                borderColor: 'rgba(0, 255, 0, 0.6)',
                borderWidth: '0 0 0 2px',
            },
            {
                type: Type.ModifiedLine,
                isWholeLine: true,
                borderStyle: 'solid',
                borderColor: 'rgba(0, 0, 255, 0.6)',
                borderWidth: '0 0 0 2px',
            },
            {
                type: Type.RemovedLine,
                isWholeLine: true,
                borderStyle: 'dotted',
                borderColor: 'rgba(255, 0, 0, 0.6)',
                borderWidth: '0 0 0 2px',
            },
        ];
    }

    applyDecorations(update: DityDiffUpdate): void {
        const modifications = update.modified.map(range => this.createDecorationOptions(range));
        const additions = update.added.map(range => this.createDecorationOptions(range));
        const removals = update.removed.map(line => this.createDecorationOptions(line));
        this.editorDecorationsService.setDecorations(update.uri, Type.ModifiedLine, modifications);
        this.editorDecorationsService.setDecorations(update.uri, Type.AddedLine, additions);
        this.editorDecorationsService.setDecorations(update.uri, Type.RemovedLine, removals);
    }

    protected createDecorationOptions(from: LineRange | number): DecorationOptions {
        if (typeof from === 'number') {
            return <DecorationOptions>{ range: Range.create(Position.create(from, 0), Position.create(from, 0)) };
        } else {
            return <DecorationOptions>{ range: Range.create(Position.create(from.start, 0), Position.create(from.end, 0)) };
        }
    }
}
