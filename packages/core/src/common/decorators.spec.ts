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

import { expect } from 'chai';
import { ConcurrencyLock } from './decorators';

describe('decorators', () => {

    it('ConcurrencyLock()', async () => {
        class Test {
            testMethodCallCount = 0;
            @ConcurrencyLock()
            async testMethod(): Promise<number> {
                this.testMethodCallCount += 1;
                return new Promise(resolve => setTimeout(resolve, 333, this.testMethodCallCount));
            }
        }
        const test = new Test();
        expect(test.testMethodCallCount).eq(0);
        const a = test.testMethod();
        expect(test.testMethodCallCount).eq(1);
        const b = test.testMethod();
        expect(test.testMethodCallCount).eq(1);
        const c = test.testMethod();
        expect(test.testMethodCallCount).eq(1);
        expect(await a).eq(1);
        expect(test.testMethodCallCount).eq(2);
        const d = test.testMethod();
        expect(test.testMethodCallCount).eq(2);
        const e = test.testMethod();
        expect(test.testMethodCallCount).eq(2);
        expect(await b).eq(2);
        expect(await c).eq(2);
        expect(test.testMethodCallCount).eq(3);
        expect(await d).eq(3);
        expect(await e).eq(3);
        expect(test.testMethodCallCount).eq(3);
    });
});
