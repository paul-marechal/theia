/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import URI from "../common/uri";

/**
 * An endpoint provides URLs for http and ws, based on configuration and defaults.
 */
export class Endpoint {
    static readonly PROTO_HTTPS: string = "https:";
    static readonly PROTO_HTTP: string = "http:";
    static readonly PROTO_WS: string = "ws:";
    static readonly PROTO_WSS: string = "wss:";
    static readonly PROTO_FILE: string = "file:";

    protected readonly uri: URI;

    constructor(
        protected readonly options: Endpoint.Options = {},
        protected readonly location: Endpoint.Location = window.location
    ) {
        this.uri = new URI(location.toString());
    }

    getWebSocketUrl(): URI {
        return new URI(`${this.wsScheme}//${this.host}${this.pathname}${this.path}`);
    }

    getRestUrl(): URI {
        return new URI(`${this.httpScheme}//${this.host}${this.pathname}${this.path}`);
    }

    protected get pathname() {
        if (this.location.protocol === Endpoint.PROTO_FILE) {
            return ''; // change here for electron ?
        }
        const split = this.location.pathname.split('/');
        return split.slice(0, split.length - 1).join('/');
    }

    protected get host() {
        const remote = this.uri.searchQuery('remote');
        if (remote) {
            return remote;
        }
        if (this.location.host) {
            return this.location.host;
        }
        return 'localhost' + this.port;
    }

    protected get port(): string {
        const port = this.uri.authority.split(':', 2)[1];
        return port ? `:${port}` : '';
    }

    protected get wsScheme() {
        return this.httpScheme === Endpoint.PROTO_HTTPS ? Endpoint.PROTO_WSS : Endpoint.PROTO_WS;
    }

    protected get httpScheme() {
        if (this.options.httpScheme) {
            return this.options.httpScheme;
        }
        if (this.location.protocol === Endpoint.PROTO_HTTP ||
            this.location.protocol === Endpoint.PROTO_HTTPS) {
            return this.location.protocol;
        }
        return Endpoint.PROTO_HTTP;
    }

    protected get path() {
        if (this.options.path) {
            if (this.options.path.startsWith("/")) {
                return this.options.path;
            } else {
                return '/' + this.options.path;
            }
        }
        return this.options.path || "";
    }
}

export namespace Endpoint {
    export class Options {
        host?: string;
        wsScheme?: string;
        httpScheme?: string;
        path?: string;
    }

    // Necessary for running tests with dependency on TS lib on node
    // FIXME figure out how to mock with ts-node
    export class Location {
        host: string;
        pathname: string;
        search: string;
        protocol: string;
    }
}
