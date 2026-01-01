# VSCode Rewind

Year-in-review vibes for your coding life. Rewind tracks how you actually code in VS Code—time, typing, languages, projects, and AI assists—then gives you a clean dashboard and exportable data for your own "Wrapped" moments.

## What You Get
- Live dashboard inside VS Code (status bar button: 📈 Rewind)
- Typing + time metrics: characters, words, sessions, active time
- Language and file breakdowns with top lists
- AI assist estimates (large insertions)
- One-click export to JSON for your own visuals

## Commands
- **Rewind: Open Dashboard** — opens the live webview
- **Rewind: Show Stats** — quick inline summary
- **Rewind: Export Data** — writes JSON to global storage exports
- **Rewind: Reset Data** — clears tracked metrics

## Install (VSIX)
1. Download or build `vscode-rewind-0.0.1.vsix`.
2. In VS Code, run **Extensions: Install from VSIX…** and select the file.
3. Reload. Click 📈 Rewind in the status bar or use the commands above.

## Build / Run (dev)
```bash
npm install
npm run compile
# Launch extension dev host
# In VS Code: F5 ("Run VSCode Rewind" launch config)
```

## Exported Data
Exports land under VS Code global storage, e.g. on Windows:
`%APPDATA%/Code/User/globalStorage/codesuke.vscode-rewind/exports/metrics-<timestamp>.json`

## Privacy
- All data stays local by default; no telemetry leaves your machine.
- You choose when to export and share.

## Roadmap Ideas
- Git activity (commits/branches), project switching
- Richer Copilot signals (if APIs allow)
- Calendar heatmaps + shareable cards

## License
MIT
