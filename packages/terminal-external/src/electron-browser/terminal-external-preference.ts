/********************************************************************************
 * Copyright (C) 2021 Ericsson and others.
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

import { inject, injectable, interfaces } from 'inversify';
import {
    FrontendApplicationContribution,
    PreferenceSchema,
    PreferenceService
} from '@theia/core/lib/browser';
import { PreferenceSchemaProvider } from '@theia/core/lib/browser/preferences/preference-contribution';
import { isWindows, isOSX } from '@theia/core/lib/common/os';
import { TerminalExternalService, TerminalExternalConfiguration } from '../common/terminal-external';

export const TerminalExternalPreferences = Symbol('TerminalExternalPreferences');

export function bindTerminalExternalPreferences(bind: interfaces.Bind): void {
    bind(TerminalExternalPreferenceService).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).to(TerminalExternalPreferenceService).inSingletonScope();
}

@injectable()
export class TerminalExternalPreferenceService implements FrontendApplicationContribution {

    @inject(PreferenceSchemaProvider)
    private readonly preferenceSchemaProvider: PreferenceSchemaProvider;

    @inject(PreferenceService)
    private readonly preferences: PreferenceService;

    @inject(TerminalExternalService)
    private readonly terminalExternalService: TerminalExternalService;

    async initialize(): Promise<void> {
        this.getConfigSchema().then(schema => this.preferenceSchemaProvider.setSchema(schema));

    }

    async getConfigSchema(): Promise<PreferenceSchema> {
        console.error('getting schema again');
        const hostExec = await this.terminalExternalService.getDefaultExec();
        const schema: PreferenceSchema = {
            type: 'object',
            properties: {
                'terminal.external.windowsExec': {
                    type: 'string',
                    description: 'Customizes which terminal to run on Windows.',
                    default: `${isWindows ? hostExec : 'C:\\WINDOWS\\System32\\cmd.exe'}`
                },
                'terminal.external.osxExec': {
                    type: 'string',
                    description: 'Customizes which terminal application to run on macOS.',
                    default: `${isOSX ? hostExec : 'Terminal.app'}`
                },
                'terminal.external.linuxExec': {
                    type: 'string',
                    description: 'Customizes which terminal to run on Linux.',
                    default: `${!(isWindows || isOSX) ? hostExec : 'xterm'}`
                }
            }
        };
        return schema;
    }

    /**
     * Get the external terminal configurations from preferences.
     */
    getTerminalExternalConfiguration(): TerminalExternalConfiguration {
        return {
            'terminal.external.linuxExec': <string>this.preferences.get('terminal.external.linuxExec'),
            'terminal.external.osxExec': <string>this.preferences.get('terminal.external.osxExec'),
            'terminal.external.windowsExec': <string>this.preferences.get('terminal.external.windowsExec')
        };
    }
}
