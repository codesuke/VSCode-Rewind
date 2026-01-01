import * as vscode from 'vscode';
import { MetricStore } from './store';

interface TimeTrackerOptions {
    idleThresholdMs: number;
}

export class TimeTracker {
    private lastActivity: number | null = null;

    constructor(private readonly store: MetricStore, private readonly options: TimeTrackerOptions) {}

    register(subscriptions: vscode.Disposable[]): void {
        subscriptions.push(
            vscode.window.onDidChangeWindowState((state) => {
                if (state.focused) {
                    this.markActivity();
                }
            })
        );
    }

    markActivity(): void {
        const now = Date.now();

        if (this.lastActivity === null) {
            this.lastActivity = now;
            this.store.startSession();
            return;
        }

        const delta = now - this.lastActivity;
        if (delta > this.options.idleThresholdMs) {
            this.store.startSession();
        } else {
            this.store.addActiveMs(delta);
        }

        this.lastActivity = now;
    }

    dispose(): void {
        // Placeholder for future cleanup
    }
}
