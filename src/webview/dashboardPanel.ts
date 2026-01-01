import * as vscode from 'vscode';
import * as path from 'path';
import { MetricsSnapshot } from '../metrics/store';

export class DashboardPanel {
    private static currentPanel: DashboardPanel | undefined;
    private readonly panel: vscode.WebviewPanel;

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
    }

    static show(context: vscode.ExtensionContext, snapshot: MetricsSnapshot): void {
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.update(snapshot);
            DashboardPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'rewindDashboard',
            'Rewind Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        DashboardPanel.currentPanel = new DashboardPanel(panel);
        DashboardPanel.currentPanel.update(snapshot);

        panel.onDidDispose(() => {
            DashboardPanel.currentPanel = undefined;
        });
    }

    private update(snapshot: MetricsSnapshot): void {
        this.panel.webview.html = this.render(snapshot);
    }

    private render(snapshot: MetricsSnapshot): string {
        const topLanguages = this.topEntries(snapshot.languages, 5).map(({ key, value }) => ({
            label: key,
            value,
        }));
        const topFiles = this.topEntries(snapshot.filesEdited, 5).map(({ key, value }) => ({
            label: path.basename(key) || key,
            value,
        }));

        const styles = `
            :root {
                color-scheme: light dark;
                --bg: var(--vscode-editor-background, #111);
                --fg: var(--vscode-editor-foreground, #eee);
                --accent: var(--vscode-editorHoverWidget-highlightForeground, #4FC3F7);
                --muted: var(--vscode-descriptionForeground, #999);
                --card: rgba(255,255,255,0.04);
                --border: rgba(255,255,255,0.08);
            }
            * { box-sizing: border-box; }
            body {
                margin: 0;
                padding: 24px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: var(--bg);
                color: var(--fg);
            }
            h1 { margin: 0 0 16px; font-size: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
            .card {
                padding: 16px;
                border-radius: 10px;
                background: var(--card);
                border: 1px solid var(--border);
                box-shadow: 0 6px 18px rgba(0,0,0,0.12);
            }
            .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); }
            .value { font-size: 24px; margin-top: 4px; font-weight: 600; }
            .muted { color: var(--muted); font-size: 12px; margin-top: 24px; }
            .section { margin-top: 20px; }
            .section h2 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted); }
            .list { display: grid; gap: 8px; }
            .row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: var(--card); border: 1px solid var(--border); }
            .row .name { font-size: 13px; }
            .row .stat { font-size: 13px; color: var(--muted); }
            .progress { margin-top: 4px; width: 100%; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
            .progress span { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), #7dd3fc); }
        `;

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Rewind Dashboard</title>
<style>${styles}</style>
</head>
<body>
    <h1>VSCode Rewind Snapshot</h1>
    <div class="grid">
        ${this.metricCard('Active Time', this.formatDuration(snapshot.activeMs))}
        ${this.metricCard('Characters Typed', snapshot.charactersTyped.toLocaleString())}
        ${this.metricCard('Words Typed', snapshot.wordsTyped.toLocaleString())}
        ${this.metricCard('Files Edited', snapshot.filesEditedCount.toLocaleString())}
        ${this.metricCard('Languages', snapshot.languagesCount.toLocaleString())}
        ${this.metricCard('Sessions', snapshot.sessions.toLocaleString())}
        ${this.metricCard('AI Insertions (est.)', snapshot.aiInsertions.toLocaleString())}
        ${this.metricCard('AI Characters (est.)', snapshot.aiCharacters.toLocaleString())}
    </div>

    <div class="section">
        <h2>Top Languages</h2>
        <div class="list">
            ${this.renderList(topLanguages)}
        </div>
    </div>

    <div class="section">
        <h2>Top Files</h2>
        <div class="list">
            ${this.renderList(topFiles)}
        </div>
    </div>
    <div class="muted">Updated ${new Date(snapshot.updatedAt).toLocaleString()}</div>
</body>
</html>`;
    }

    private metricCard(label: string, value: string): string {
        return `<div class="card"><div class="label">${label}</div><div class="value">${value}</div></div>`;
    }

    private formatDuration(ms: number): string {
        if (ms <= 0) return '0m';
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    }

    private renderList(entries: { label: string; value: number }[]): string {
        if (!entries.length) {
            return `<div class="row"><div class="name">No data yet</div></div>`;
        }

        const max = Math.max(...entries.map((e) => e.value));

        return entries
            .map((entry) => {
                const width = max > 0 ? Math.max((entry.value / max) * 100, 6) : 0;
                return `<div class="row">
                    <div class="name">${entry.label}</div>
                    <div class="stat">${entry.value.toLocaleString()}</div>
                </div>
                <div class="progress"><span style="width:${width}%;"></span></div>`;
            })
            .join('');
    }

    private topEntries(map: Record<string, number>, limit: number): { key: string; value: number }[] {
        return Object.entries(map)
            .map(([key, value]) => ({ key, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, limit);
    }
}
