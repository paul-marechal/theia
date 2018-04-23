/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { StorageService, LocalStorageService } from '@theia/core/lib/browser/storage-service';
import { WorkspaceService } from './workspace-service';
import { inject, injectable, postConstruct } from 'inversify';
import { ILogger } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';

/*
 * Prefixes any stored data with the current workspace path.
 */
@injectable()
export class WorkspaceStorageService implements StorageService {

    private prefix: string;

    @inject(WorkspaceService)
    protected workspaceService: WorkspaceService;

    protected storageService: LocalStorageService;
    protected initialized = new Deferred<void>();

    constructor(
        @inject(ILogger) protected logger: ILogger,
        @inject(ApplicationServer) protected applicationServer: ApplicationServer,
    ) {
        this.storageService = new LocalStorageService(logger, applicationServer);
        this.storageService.init();
    }

    @postConstruct()
    protected async init(): Promise<void> {
        const statFile = await this.workspaceService.root;
        this.prefix = statFile ? new URI(statFile.uri).path.toString() : '_global_';
        this.initialized.resolve();
    }

    async setData<T>(key: string, data: T): Promise<void> {
        if (!this.prefix) { await this.initialized.promise; }
        const fullKey = this.prefixWorkspaceURI(key);
        return this.storageService.setData(fullKey, data);
    }

    async getData<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        if (!this.prefix) { await this.initialized.promise; }
        const fullKey = this.prefixWorkspaceURI(key);
        return this.storageService.getData(fullKey, defaultValue);
    }

    protected prefixWorkspaceURI(originalKey: string): string {
        return this.prefix + ":" + originalKey;
    }
}
