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
import { DefaultPluginUri } from './plugin-uri';

describe('DefaultPluginUri', () => {

    it('#create', () => {
        const withoutVersion = DefaultPluginUri.create({
            type: 'someType',
            id: 'somePublisher.somePlugin'
        });
        const withVersion = DefaultPluginUri.create({
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3'
        });
        expect(withoutVersion).eq('plugin:/someType/somePublisher.somePlugin');
        expect(withVersion).eq('plugin:/someType/somePublisher.somePlugin@1.2.3');
    });

    it('#parse', () => {
        const expected = {
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3'
        };
        const uri = DefaultPluginUri.create(expected);
        const parsed = DefaultPluginUri.parse(uri);
        expect(parsed).deep.equal(expected);
    });

    it('#simplified', () => {
        const input = DefaultPluginUri.create({
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3',
            provider: 'someProvider'
        });
        const radical = DefaultPluginUri.radical(input);
        expect(radical).eq('plugin:/someType/somePublisher.somePlugin');
    });
});
