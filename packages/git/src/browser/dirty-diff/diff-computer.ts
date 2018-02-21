/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as jsdiff from 'diff';

export class DiffComputer {

    compute(previous: string[], current: string[]): DiffResult[] {
        const diffResult = jsdiff.diffArrays(previous, current);
        return diffResult;
    }

}

export class DirtyDiffComputer extends DiffComputer {

    computeDirtyDiff(previous: string[], currentContents: string[]): DirtyDiff {
        const added: LineRange[] = [];
        const removed: number[] = [];
        const modified: LineRange[] = [];
        const changes = this.compute(previous, currentContents);
        let lastLine = -1;
        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            const next = changes[i + 1];
            if (change.added) {
                // case: addition
                const start = lastLine + 1;
                const end = lastLine = lastLine + change.count!;
                added.push(<LineRange>{ start, end });
            } else if (change.removed && next && next.added) {
                if (i === 0 && next.value.length === 1 && next.value[0].length === 0) {
                    // special case: removing at the beginning
                    removed.push(0);
                } else if (i === 0 && change.value.length === 1 && change.value[0].length === 0) {
                    // special case: adding at the beginning
                    const start = 0;
                    const end = lastLine = next.count! - 1;
                    added.push(<LineRange>{ start, end });
                } else {
                    // default case is a modification
                    const start = lastLine + 1;
                    const end = lastLine = lastLine + next.count!;
                    modified.push(<LineRange>{ start, end });
                }
                i++; // consume next eagerly
            } else if (change.removed && !(next && next.added)) {
                removed.push(Math.max(0, lastLine));
            } else {
                lastLine += change.count!;
            }
        }
        return <DirtyDiff>{ added, removed, modified };
    }

}

export interface DiffResult extends jsdiff.IArrayDiffResult { }

export interface DirtyDiff {
    /**
     * Lines added by comparision to previous revision.
     */
    readonly added: LineRange[];
    /**
     * Lines, after which lines were removed by comparison to previous revision.
     */
    readonly removed: number[];
    /**
     * Lines modified by comparison to previous revision.
     */
    readonly modified: LineRange[];
}

export interface LineRange {
    start: number;
    end: number;
}
