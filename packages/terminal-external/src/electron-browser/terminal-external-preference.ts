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
    createPreferenceProxy,
    FrontendApplicationContribution,
    PreferenceProxy,
    PreferenceSchema,
    PreferenceService
} from '@theia/core/lib/browser';
import { PreferenceSchemaProvider } from '@theia/core/lib/browser/preferences/preference-contribution';
import { isWindows, isOSX } from '@theia/core/lib/common/os';
import { TerminalExternalService, TerminalExternalConfiguration } from '../common/terminal-external';

export const TerminalExternalPreferences = Symbol('TerminalExternalPreferences');
export type TerminalExternalPreferences = PreferenceProxy<TerminalExternalConfiguration>;

export async function createTerminalExternalPreferenceProxy(preferences: PreferenceService): Promise<TerminalExternalPreferences> {
    const schema = await TerminalExternalPreferenceService.getConfigSchema();
    return createPreferenceProxy(preferences, schema);
}

export function bindTerminalExternalPreferences(bind: interfaces.Bind): void {
    bind(TerminalExternalPreferences).toDynamicValue(async ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createTerminalExternalPreferenceProxy(preferences);
    });
    bind(TerminalExternalPreferenceService).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).to(TerminalExternalPreferenceService).inSingletonScope();
}

@injectable()
export class TerminalExternalPreferenceService implements FrontendApplicationContribution {

    @inject(PreferenceSchemaProvider)
    private readonly preferenceSchemaProvider: PreferenceSchemaProvider;

    @inject(TerminalExternalService)
    private static readonly terminalExternalService: TerminalExternalService;

    @inject(TerminalExternalPreferences)
    private readonly terminalExternalPreferences: TerminalExternalPreferences;

    private static TerminalExternalConfigSchema: Promise<PreferenceSchema>;

    initialize(): void {
        TerminalExternalPreferenceService.getConfigSchema().then(schema => this.preferenceSchemaProvider.setSchema(schema));
    }

    static async getConfigSchema(): Promise<PreferenceSchema> {
        if (!TerminalExternalPreferenceService.TerminalExternalConfigSchema) {
            TerminalExternalPreferenceService.TerminalExternalConfigSchema = new Promise(async r => {
                const hostExec = await TerminalExternalPreferenceService.terminalExternalService.getDefaultExec();
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
                r(schema);
            });
        }
        return TerminalExternalPreferenceService.TerminalExternalConfigSchema;
    }

    /**
     * Get the external terminal configurations from preferences.
     */
    getTerminalExternalConfiguration(): TerminalExternalConfiguration {
        return {
            'terminal.external.linuxExec': this.terminalExternalPreferences['terminal.external.linuxExec'],
            'terminal.external.osxExec': this.terminalExternalPreferences['terminal.external.osxExec'],
            'terminal.external.windowsExec': this.terminalExternalPreferences['terminal.external.windowsExec']
        };
    }
}
