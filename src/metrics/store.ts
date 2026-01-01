import * as vscode from 'vscode';

export interface MetricsSnapshot {
    charactersTyped: number;
    wordsTyped: number;
    filesEdited: Record<string, number>;
    languages: Record<string, number>;
    sessions: number;
    activeMs: number;
    aiInsertions: number;
    aiCharacters: number;
    createdAt: string;
    updatedAt: string;
    filesEditedCount: number;
    languagesCount: number;
}

interface PersistedState {
    charactersTyped: number;
    wordsTyped: number;
    filesEdited: Record<string, number>;
    languages: Record<string, number>;
    sessions: number;
    activeMs: number;
    aiInsertions: number;
    aiCharacters: number;
    createdAt: string;
    updatedAt: string;
}

interface TypingPayload {
    charsAdded: number;
    wordsAdded: number;
    languageId: string;
    filePath: string;
    aiCharacters: number;
}

const STORAGE_KEY = 'rewind.metrics.v1';

export class MetricStore {
    private state: PersistedState;

    constructor(private readonly memento: vscode.Memento) {
        this.state = this.load();
    }

    getSnapshot(): MetricsSnapshot {
        return {
            ...this.state,
            filesEditedCount: Object.keys(this.state.filesEdited).length,
            languagesCount: Object.keys(this.state.languages).length,
        };
    }

    recordTyping(payload: TypingPayload): void {
        this.state.charactersTyped += payload.charsAdded;
        this.state.wordsTyped += payload.wordsAdded;
        this.state.filesEdited[payload.filePath] = (this.state.filesEdited[payload.filePath] ?? 0) + payload.charsAdded;
        this.state.languages[payload.languageId] = (this.state.languages[payload.languageId] ?? 0) + payload.charsAdded;

        if (payload.aiCharacters > 0) {
            this.state.aiInsertions += 1;
            this.state.aiCharacters += payload.aiCharacters;
        }

        this.touch();
        void this.persist();
    }

    startSession(): void {
        this.state.sessions += 1;
        this.touch();
        void this.persist();
    }

    addActiveMs(durationMs: number): void {
        if (durationMs <= 0) {
            return;
        }
        this.state.activeMs += durationMs;
        this.touch();
        void this.persist();
    }

    async reset(): Promise<void> {
        this.state = this.initialState();
        await this.persist();
    }

    async export(storageUri: vscode.Uri): Promise<vscode.Uri> {
        const exportDir = vscode.Uri.joinPath(storageUri, 'exports');
        await vscode.workspace.fs.createDirectory(exportDir);
        const filename = `metrics-${Date.now()}.json`;
        const target = vscode.Uri.joinPath(exportDir, filename);
        const snapshot = this.getSnapshot();
        const content = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8');
        await vscode.workspace.fs.writeFile(target, content);
        return target;
    }

    dispose(): void {
        // Placeholder for future cleanup
    }

    private touch(): void {
        this.state.updatedAt = new Date().toISOString();
    }

    private load(): PersistedState {
        const existing = this.memento.get<PersistedState>(STORAGE_KEY);
        if (existing) {
            return existing;
        }
        const initial = this.initialState();
        void this.memento.update(STORAGE_KEY, initial);
        return initial;
    }

    private async persist(): Promise<void> {
        await this.memento.update(STORAGE_KEY, this.state);
    }

    private initialState(): PersistedState {
        const now = new Date().toISOString();
        return {
            charactersTyped: 0,
            wordsTyped: 0,
            filesEdited: {},
            languages: {},
            sessions: 0,
            activeMs: 0,
            aiInsertions: 0,
            aiCharacters: 0,
            createdAt: now,
            updatedAt: now,
        };
    }
}
