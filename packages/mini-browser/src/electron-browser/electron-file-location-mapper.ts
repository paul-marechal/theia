/********************************************************************************
 * Copyright (C) 2019 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { FileLocationMapper } from '../browser/location-mapper-service';

// tslint:disable-next-line:no-implicit-dependencies
const { CSToken } = require('@theia/electron/electron-token');

@injectable()
export class ElectronFileLocationMapper extends FileLocationMapper {

    @inject(CSToken)
    protected readonly cst: string;

    protected getEndpoint(location: string): URI {
        const endpoint = super.getEndpoint(location);
        if (!this.cst) {
            return endpoint; // no cst = passthrough
        }
        return endpoint.withQuery(`${endpoint.query}&cst=${encodeURIComponent(this.cst)}`);
    }

}
