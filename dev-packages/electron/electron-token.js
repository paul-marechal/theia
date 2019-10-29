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

// @ts-check

const randomNumber = require('random-number-csprng');
const fs = require('fs-extra');
const path = require('path');

exports.CSToken = Symbol('CSToken');

/**
 * @returns {Promise<void>}
 */
exports.generateCSToken = async function (filePath) {
    await fs.ensureDir(path.dirname(filePath));
    const buffer = Buffer.alloc(128);
    const promises = [];
    for (let i = 0; i < buffer.byteLength; i++) {
        promises.push(randomNumber(0, 256).then(n => buffer[i] = n));
    }
    await Promise.all(promises);
    await fs.writeFile(filePath, buffer.toString('base64'));
};
