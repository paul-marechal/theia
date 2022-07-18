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

import { injectable } from 'inversify';
import { MessageService } from '../message-service';
import { Progress } from '../message-service-protocol';

@injectable()
export class MockMessageService implements MessageService {

    async log(): Promise<undefined> {
        return;
    }

    async info(): Promise<undefined> {
        return;
    }

    async warn(): Promise<undefined> {
        return;
    }

    async error(): Promise<undefined> {
        return;
    }

    async showProgress(): Promise<Progress> {
        return {
            id: 'null',
            result: Promise.resolve(undefined),
            cancel: () => { },
            report: () => { }
        }
    }
}
