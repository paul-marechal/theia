// *****************************************************************************
// Copyright (C) 2017 TypeFox and others.
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

import { Container } from 'inversify';
import { WindowService } from './window/window-service';
import { MockWindowService } from './window/test/mock-window-service';
import { LocalStorageService, StorageService } from './storage-service';
import { expect } from 'chai';
import { ILogger } from '../common/logger';
import { MockLogger } from '../common/test/mock-logger';
import { MessageService } from '../common/';
import { MockMessageService } from '../common/test/mock-message-service';

let storageService: StorageService;

before(() => {
    const testContainer = new Container();

    testContainer.bind(ILogger).to(MockLogger).inTransientScope();
    testContainer.bind(WindowService).to(MockWindowService).inSingletonScope();
    testContainer.bind(MessageService).to(MockMessageService).inSingletonScope();

    testContainer.bind(StorageService).to(LocalStorageService).inSingletonScope();

    storageService = testContainer.get(StorageService);
});

describe('storage-service', () => {

    it('stores data', async () => {
        storageService.setData('foo', {
            test: 'foo'
        });
        expect(await storageService.getData('bar', 'bar')).equals('bar');
        expect((await storageService.getData('foo', {
            test: 'bar'
        })).test).equals('foo');
    });

    it('removes data', async () => {
        storageService.setData('foo', {
            test: 'foo'
        });
        expect((await storageService.getData('foo', {
            test: 'bar'
        })).test).equals('foo');

        storageService.setData('foo', undefined);
        expect((await storageService.getData('foo', {
            test: 'bar'
        })).test).equals('bar');
    });

});
