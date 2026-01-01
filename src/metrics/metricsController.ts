import * as vscode from 'vscode';
import { MetricStore, MetricsSnapshot } from './store';
import { TimeTracker } from './timeTracker';
import { TypingTracker } from './typingTracker';

export interface MetricsControllerOptions {
    idleThresholdMs: number;
    largeEditThreshold: number;
}

export class MetricsController {
    private readonly store: MetricStore;
    private readonly timeTracker: TimeTracker;
    private readonly typingTracker: TypingTracker;

    constructor(private readonly context: vscode.ExtensionContext, private readonly options: MetricsControllerOptions) {
        this.store = new MetricStore(context.workspaceState);
        this.timeTracker = new TimeTracker(this.store, { idleThresholdMs: options.idleThresholdMs });
        this.typingTracker = new TypingTracker(this.store, this.timeTracker, options.largeEditThreshold);
    }

    initialize(): void {
        this.timeTracker.register(this.context.subscriptions);
        this.typingTracker.register(this.context.subscriptions);
    }

    getSnapshot(): MetricsSnapshot {
        return this.store.getSnapshot();
    }

    async exportData(): Promise<vscode.Uri | undefined> {
        try {
            return await this.store.export(this.context.globalStorageUri);
        } catch (err) {
            console.error('Rewind export failed', err);
            return undefined;
        }
    }

    async reset(): Promise<void> {
        await this.store.reset();
    }

    dispose(): void {
        this.typingTracker.dispose();
        this.timeTracker.dispose();
        this.store.dispose();
    }
}
