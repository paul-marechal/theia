/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { GitDiffWidget } from "../diff/git-diff-widget";
import { Git } from "../../common";
import { GitRepositoryProvider } from "../git-repository-provider";
import { LabelProvider, open } from "@theia/core/lib/browser";
import { h } from "@phosphor/virtualdom";
import { GitCommitNode } from "./git-history-widget";
import { Md5 } from "ts-md5";
import URI from "@theia/core/lib/common/uri";
import { injectable, inject } from "inversify";
import { Widget } from "@phosphor/widgets";

export const GIT_COMMIT_DETAIL = "git-commit-detail-widget";

export const GitCommitDetailWidgetOptions = Symbol("GitCommitDetailWidgetOptions");
export interface GitCommitDetailWidgetOptions {
    readonly widgetId: string;
    readonly widgetLabel: string;
    readonly commit: GitCommitNode;
    readonly diffOptions: Git.Options.Diff;
}

@injectable()
export class GitCommitDetailWidget extends GitDiffWidget {

    constructor(
        @inject(GitRepositoryProvider) protected readonly repositoryProvider: GitRepositoryProvider,
        @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
        @inject(GitCommitDetailWidgetOptions) protected readonly commitDetailOptions: GitCommitDetailWidgetOptions
    ) {
        super();

        this.id = commitDetailOptions.widgetId;
        this.title.label = commitDetailOptions.widgetLabel;
        this.options = commitDetailOptions.diffOptions;
        this.title.closable = true;
        this.title.iconClass = "icon-git-commit";
    }

    protected renderDiffListHeader(): h.Child {
        const elements = [];
        const authorEMail = this.commitDetailOptions.commit.authorEmail;
        const hash = Md5.hashStr(authorEMail);
        const subject = h.div({ className: "subject" }, this.commitDetailOptions.commit.commitMessage);
        const body = h.div({ className: "body" }, this.commitDetailOptions.commit.messageBody || "");
        const subjectRow = h.div({ className: "header-row" }, h.div({ className: "subjectContainer" }, subject, body));
        const author = h.div({ className: "author header-value noWrapInfo" }, this.commitDetailOptions.commit.authorName);
        const mail = h.div({ className: "mail header-value noWrapInfo" }, `<${authorEMail}>`);
        const authorRow = h.div({ className: "header-row noWrapInfo" }, h.div({ className: 'theia-header' }, 'author: '), author);
        const mailRow = h.div({ className: "header-row noWrapInfo" }, h.div({ className: 'theia-header' }, 'e-mail: '), mail);
        const authorDate = new Date(this.commitDetailOptions.commit.authorDate);
        const dateStr = authorDate.toLocaleDateString('en', {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour12: true,
            hour: "numeric",
            minute: "numeric"
        });
        const date = h.div({ className: "date header-value noWrapInfo" }, dateStr);
        const dateRow = h.div({ className: "header-row noWrapInfo" }, h.div({ className: 'theia-header' }, 'date: '), date);
        const revisionRow = h.div({ className: 'header-row noWrapInfo' },
            h.div({ className: 'theia-header' }, 'revision: '),
            h.div({ className: 'header-value noWrapInfo' }, this.commitDetailOptions.commit.commitSha));
        const gravatar = h.div({ className: "image-container" },
            h.img({ className: "gravatar", src: `https://www.gravatar.com/avatar/${hash}?d=robohash` }));
        const commitInfo = h.div({ className: "header-row commit-info-row" }, gravatar, h.div({ className: "commit-info" }, authorRow, mailRow, dateRow, revisionRow));
        elements.push(subjectRow, commitInfo);
        const header = h.div({ className: 'theia-header' }, 'Files changed');

        return h.div({ className: "diff-header" }, ...elements, header);
    }

    protected ref: Widget | undefined;
    protected async doOpen(uriToOpen: URI): Promise<void> {
        const ref = this.ref;
        const widget = await open(this.openerService, uriToOpen, {
            mode: 'reveal',
            widgetOptions: ref ?
                { area: 'main', mode: 'tab-after', ref } :
                { area: 'main', mode: 'split-right', ref: this }
        });
        this.ref = widget instanceof Widget ? widget : undefined;
    }

}
