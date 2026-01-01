import * as vscode from 'vscode';
import { MetricsController } from './metrics/metricsController';
import { DashboardPanel } from './webview/dashboardPanel';

let controller: MetricsController | undefined;

export async function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('rewind');

    controller = new MetricsController(context, {
        idleThresholdMs: config.get<number>('idleThresholdMs', 300000),
        largeEditThreshold: config.get<number>('largeEditThreshold', 50),
    });

    controller.initialize();

    const showStats = vscode.commands.registerCommand('vscode-rewind.showStats', async () => {
        const snapshot = controller?.getSnapshot();
        if (!snapshot) {
            vscode.window.showWarningMessage('Rewind is not ready yet.');
            return;
        }

        const message = [
            `Active time today: ${formatMs(snapshot.activeMs)}`,
            `Chars typed: ${snapshot.charactersTyped}`,
            `Words typed: ${snapshot.wordsTyped}`,
            `Files edited: ${snapshot.filesEditedCount}`,
            `Languages: ${snapshot.languagesCount}`,
        ].join(' · ');

        vscode.window.showInformationMessage(message);
    });

    const exportData = vscode.commands.registerCommand('vscode-rewind.exportData', async () => {
        const uri = await controller?.exportData();
        if (uri) {
            vscode.window.showInformationMessage(`Rewind data exported to ${uri.fsPath}`);
        } else {
            vscode.window.showWarningMessage('Rewind export failed.');
        }
    });

    const resetData = vscode.commands.registerCommand('vscode-rewind.resetData', async () => {
        await controller?.reset();
        vscode.window.showInformationMessage('Rewind data reset.');
    });

    const openDashboard = vscode.commands.registerCommand('vscode-rewind.openDashboard', async () => {
        const snapshot = controller?.getSnapshot();
        if (!snapshot) {
            vscode.window.showWarningMessage('Rewind is not ready yet.');
            return;
        }
        DashboardPanel.show(context, snapshot);
    });

    const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusItem.text = '$(graph) Rewind';
    statusItem.command = 'vscode-rewind.openDashboard';
    statusItem.tooltip = 'Open VSCode Rewind dashboard';
    statusItem.show();

    context.subscriptions.push(showStats, exportData, resetData, openDashboard, statusItem);
}

export function deactivate() {
    controller?.dispose();
}

function formatMs(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
}
