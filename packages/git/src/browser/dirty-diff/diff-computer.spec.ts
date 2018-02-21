/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import { expect } from 'chai';
chai.use(require('chai-string'));

import { DirtyDiffComputer, DirtyDiff } from './diff-computer';

let dirtyDiffComputer: DirtyDiffComputer;

before(() => {
    dirtyDiffComputer = new DirtyDiffComputer();
});

// tslint:disable:no-unused-expression

describe("dirty-diff-computer", () => {

    it("remove single line", () => {
        const dirtyDiff = createDirtyDiff(
            `FIRST\nSECOND\nTHIRD`,
            `FIRST\nTHIRD`,
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            added: [],
            modified: [],
            removed: [0],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`remove ${lines} line${pluralS(lines)} at the end`, () => {
            const dirtyDiff = createDirtyDiff(
                `first\nsecond` + '\nTO-BE-REMOVED\n'.repeat(lines),
                `first\nsecond`,
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [1],
                added: [],
            });
        });
    });

    it("remove all lines", () => {
        const dirtyDiff = createDirtyDiff(
            sequenceOfN(10).join('\n'),
            ``
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            added: [],
            modified: [],
            removed: [0],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`remove ${lines} line${pluralS(lines)} at the beginning`, () => {
            const dirtyDiff = createDirtyDiff(
                'TO-BE-REMOVED\n'.repeat(lines) + `left\nend`,
                `left\nend`,
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [0],
                added: [],
            });
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${lines} line${pluralS(lines)}`, () => {
            const dirtyDiff = createDirtyDiff(
                `1\n2\n3`,
                `1\n2\n` + 'ADDED\n'.repeat(lines) + `3`
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 2, end: 2 + lines - 1 }],
            });
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${lines} line${pluralS(lines)} at the beginning`, () => {
            const dirtyDiff = createDirtyDiff(
                `1\n2`,
                'ADDED\n'.repeat(lines) + `1\n2`
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 0, end: lines - 1 }],
            });
        });
    });

    it("add lines to empty files", () => {
        const dirtyDiff = createDirtyDiff(
            ``,
            `0
            2
            3`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 0, end: 2 }],
        });
    });

    it("add empty lines", () => {
        const dirtyDiff = createDirtyDiff(
            `1
            2`,
            `1\n\n
            2`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 2 }],
        });
    });

    it("add empty line after single line", () => {
        const dirtyDiff = createDirtyDiff(
            `1`,
            `1\n`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 1 }],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${lines} empty line${pluralS(lines)} at the end`, () => {
            const dirtyDiff = createDirtyDiff(
                `0\n1`,
                `0\n1` + '\n'.repeat(lines)
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 2, end: 1 + lines }],
            });
        });
    });

    it("add empty and non-empty lines", () => {
        const dirtyDiff = createDirtyDiff(
            `1
            2`,
            `1
            1.1\n
            1.2\n
            1.3
            2`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 5 }],
        });
    });

    [1, 2, 3, 4, 5].forEach(lines => {
        it(`add ${lines} line${pluralS(lines)} after single line`, () => {
            const dirtyDiff = createDirtyDiff(
                `0`,
                `0` + sequenceOfN(lines).map(n => '\n' + n).join()
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 1, end: lines }],
            });
        });
    });

    it("modify single line", () => {
        const dirtyDiff = createDirtyDiff(
            `1\n2\n3`,
            `1\n2-changed\n3`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 1, end: 1 }],
        });
    });

    it("modify all lines", () => {
        const dirtyDiff = createDirtyDiff(
            `1\n2\n3`,
            `1-changed\n2-changed\n3-changed`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 0, end: 2 }],
        });
    });

    it("modify lines at the end", () => {
        const dirtyDiff = createDirtyDiff(
            `1\n2\n3\n4`,
            `1\n2-changed\n3-changed`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 1, end: 2 }],
        });
    });

    it("multiple diffs", () => {
        const dirtyDiff = createDirtyDiff(
            `TO-BE-CHANGED\n1\n2\n3\nTO-BE-REMOVED\n4\n5\n6\n7\n8\n9`,
            `CHANGED\n1\n2\n3\n4\n5\n6\n7\n8\n9\nADDED\n`
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [3],
            added: [{ start: 10, end: 11 }],
            modified: [{ start: 0, end: 0 }],
        });
    });

    it("multiple additions", () => {
        const dirtyDiff = dirtyDiffComputer.computeDirtyDiff(
            [
                "first line",
                "",
                "foo changed on master",
                "bar changed on master",
                "",
                "",
                "",
                "",
                "",
                "last line"
            ],
            [
                "first line",
                "",
                "foo changed on master",
                "bar changed on master",
                "",
                "NEW TEXT",
                "",
                "",
                "",
                "last line",
                "",
                ""
            ]);
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [11],
            added: [{ start: 5, end: 5 }, { start: 9, end: 9 }],
            modified: [],
        });
    });

});

function createDirtyDiff(previous: string, modified: string) {
    const splitLines = (s: string) => s.split(/\r\n|\n/);
    return dirtyDiffComputer.computeDirtyDiff(splitLines(previous), splitLines(modified));
}

function sequenceOfN(n: number): number[] {
    return Array.from(new Array(n).keys());
}

function pluralS(n: number): string {
    return n > 1 ? 's' : '';
}
