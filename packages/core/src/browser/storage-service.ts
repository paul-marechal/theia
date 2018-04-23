/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable, postConstruct } from 'inversify';
import { ApplicationServer } from '../common/application-protocol';
import { Deferred } from '../common/promise-util';
import { ILogger } from '../common/logger';

export const StorageService = Symbol('IStorageService');
/**
 * The storage service provides an interface to some data storage that allows extensions to keep state among sessions.
 */
export interface StorageService {

    /**
     * Stores the given data under the given key.
     */
    setData<T>(key: string, data: T): Promise<void>;

    /**
     * Returns the data stored for the given key or the provided default value if nothing is stored for the given key.
     */
    getData<T>(key: string, defaultValue: T): Promise<T>;
    getData<T>(key: string): Promise<T | undefined>;
}

interface LocalStorage {
    // tslint:disable-next-line:no-any
    [key: string]: any;
}

@injectable()
export class LocalStorageService implements StorageService {

    private storage: LocalStorage;

    protected initialized: Deferred<void>;
    protected applicationId: string | undefined;

    constructor(
        @inject(ILogger) protected logger: ILogger,
        @inject(ApplicationServer) protected readonly applicationServer: ApplicationServer,
    ) {
        this.initialized = new Deferred<void>();
        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
        } else {
            logger.warn(log => log("The browser doesn't support localStorage. state will not be persisted across sessions."));
            this.storage = {};
        }
    }

    @postConstruct()
    async init(): Promise<void> {
        this.applicationId = await this.applicationServer.getApplicationId();
        this.initialized.resolve();
    }

    async setData<T>(key: string, data?: T): Promise<void> {
        if (!this.applicationId) { await this.initialized.promise; }
        if (data !== undefined) {
            this.storage[this.prefix(key)] = JSON.stringify(data);
        } else {
            delete this.storage[this.prefix(key)];
        }
        return Promise.resolve();
    }

    async getData<T>(key: string, defaultValue?: T): Promise<T | undefined> {
        if (!this.applicationId) { await this.initialized.promise; }
        const result = this.storage[this.prefix(key)];
        if (result === undefined) {
            return Promise.resolve(defaultValue);
        }
        return Promise.resolve(JSON.parse(result));
    }

    protected prefix(key: string): string {
        return `theia:${this.applicationId ? this.applicationId : window.location.pathname}:${key}`;
    }
}
