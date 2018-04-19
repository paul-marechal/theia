/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { StorageService } from '@theia/core/lib/browser/storage-service';
import { WorkspaceService } from './workspace-service';
import { inject, injectable, postConstruct } from 'inversify';
import { ILogger } from '@theia/core/lib/common';
import { LocalStorageService } from '@theia/core/lib/browser/storage-service';
import URI from '@theia/core/lib/common/uri';
import { Deferred } from '@theia/core/lib/common/promise-util';

/*
 * Prefixes any stored data with the current workspace path.
 */
@injectable()
export class WorkspaceStorageService implements StorageService {

    private prefix: string;
    protected initialized: Deferred<void>;
    protected storageService: StorageService;

    @inject(WorkspaceService)
    protected workspaceService: WorkspaceService;

    @inject(ILogger)
    protected logger: ILogger;

    constructor() {
        this.storageService = new LocalStorageService(this.logger);
        this.initialized = new Deferred<void>();
    }

    @postConstruct()
    protected async init(): Promise<void> {
        const statFile = await this.workspaceService.root;
        const workspace = statFile ? new URI(statFile.uri).path : '_global_';
        this.prefix = `${window.location.pathname}:${workspace}`;
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
