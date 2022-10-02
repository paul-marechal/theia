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

import URI from '@theia/core/lib/common/uri';
import { expect } from 'chai';
import { PluginUri } from './plugin-uri';

describe('PluginUri', () => {

    it('#create', () => {
        const withoutVersion = PluginUri.create({
            type: 'someType',
            id: 'somePublisher.somePlugin'
        });
        const withVersion = PluginUri.create({
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3'
        });
        expect(withoutVersion.toString(true)).eq('plugin:/someType/somePublisher.somePlugin');
        expect(withVersion.toString(true)).eq('plugin:/someType/somePublisher.somePlugin@1.2.3');
    });

    it('#parse', () => {
        const expected = {
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3'
        };
        const uri = PluginUri.create(expected);
        const parsed = PluginUri.parse(uri);
        expect(parsed).deep.equal(expected);
    });

    it('#simplified', () => {
        const input = {
            type: 'someType',
            id: 'somePublisher.somePlugin',
            version: '1.2.3',
            provider: 'someProvider'
        };
        const inputUri = PluginUri.create(input);
        const inputString = inputUri.toString(true);
        const expected = 'plugin:/someType/somePublisher.somePlugin';
        const radicalUri = PluginUri.radical(inputUri);
        const radicalString = PluginUri.radical(inputString);
        expect(radicalUri).instanceof(URI);
        expect(typeof radicalString).eq('string');
        expect(radicalUri?.toString(true)).eq(expected);
        expect(radicalString).eq(expected);
    });
});
