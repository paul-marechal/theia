/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { GitHistoryContribution, GIT_HISTORY } from "./git-history-contribution";
import { interfaces, Container } from "inversify";
import { CommandContribution, MenuContribution } from "@theia/core";
import { KeybindingContribution } from "@theia/core/lib/browser/keybinding";
import { WidgetFactory } from "@theia/core/lib/browser";
import { GitHistoryWidget } from "./git-history-widget";
import { GIT_COMMIT_DETAIL, GitCommitDetailWidgetOptions, GitCommitDetailWidget } from "./git-commit-detail-widget";

import '../../../src/browser/style/history.css';
import { GitDiffWidget } from "../diff/git-diff-widget";
import { GitBaseWidget } from "../git-base-widget";

export function bindGitHistoryModule(bind: interfaces.Bind) {

    bind(GitHistoryWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GIT_HISTORY,
        createWidget: () => ctx.container.get<GitHistoryWidget>(GitHistoryWidget)
    }));

    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: GIT_COMMIT_DETAIL,
        createWidget: (options: GitCommitDetailWidgetOptions) => {
            const child = new Container({ defaultScope: 'Singleton' });
            child.parent = ctx.container;
            child.bind(GitBaseWidget).toSelf();
            child.bind(GitDiffWidget).toSelf();
            child.bind(GitCommitDetailWidget).toSelf();
            child.bind(GitCommitDetailWidgetOptions).toConstantValue({
                ...options
            });
            return child.get(GitCommitDetailWidget);
        }
    }));

    bind(GitHistoryContribution).toSelf().inSingletonScope();
    for (const identifier of [CommandContribution, MenuContribution, KeybindingContribution]) {
        bind(identifier).toDynamicValue(ctx =>
            ctx.container.get(GitHistoryContribution)
        ).inSingletonScope();
    }

}
