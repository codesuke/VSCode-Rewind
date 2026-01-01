import * as vscode from 'vscode';
import { MetricStore } from './store';
import { TimeTracker } from './timeTracker';

export class TypingTracker {
    constructor(
        private readonly store: MetricStore,
        private readonly timeTracker: TimeTracker,
        private readonly largeEditThreshold: number
    ) {}

    register(subscriptions: vscode.Disposable[]): void {
        subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                this.handleChange(event);
            })
        );
    }

    dispose(): void {
        // No resources to clean yet
    }

    private handleChange(event: vscode.TextDocumentChangeEvent): void {
        if (event.document.isClosed) {
            return;
        }

        let charsAdded = 0;
        let wordsAdded = 0;
        let aiCharacters = 0;

        for (const change of event.contentChanges) {
            if (change.text.length > 0) {
                charsAdded += change.text.length;
                wordsAdded += this.countWords(change.text);
                if (change.text.length >= this.largeEditThreshold && change.rangeLength === 0) {
                    aiCharacters += change.text.length;
                }
            }
        }

        if (charsAdded === 0 && event.contentChanges.length === 0) {
            return;
        }

        this.timeTracker.markActivity();

        if (charsAdded === 0) {
            return;
        }

        const languageId = event.document.languageId || 'unknown';
        const filePath = event.document.uri.fsPath;

        this.store.recordTyping({
            charsAdded,
            wordsAdded,
            languageId,
            filePath,
            aiCharacters,
        });
    }

    private countWords(text: string): number {
        const trimmed = text.trim();
        if (!trimmed) {
            return 0;
        }
        return trimmed.split(/\s+/).length;
    }
}
