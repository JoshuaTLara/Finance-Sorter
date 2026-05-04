# Finance Sorter Documentation

This folder is the starting point for project documentation.

## Project Snapshot

Finance Sorter is a small browser-only expense sorting app. It lets a user drop in a CSV file, normalizes the transaction data, categorizes transactions with keyword rules, and lets the user add custom category rules in browser storage.

The app currently has no build step and no backend. It runs from static files:

- `index.html` contains the page shell and loads dependencies.
- `categories.js` contains the built-in keyword-to-category map.
- `script.js` contains CSV parsing, normalization, categorization, and rendering.

## Documentation Map

- `docs/AI/README.md`: How the AI handoff docs are meant to be used.
- `docs/AI/SESSION_CONTEXT.md`: Current repo context for future AI sessions.
- `docs/CSV_FORMATS.md`: Supported bank CSV layouts and parser mappings.
- `docs/PROJECT_PURPOSE.md`: Why the app exists and what future changes should protect.
- `AGENT.md`: Operating guide for coding agents working in this repository.

## Run Locally

Because this is a static browser app, it can be opened directly in a browser. For the cleanest local testing flow, run a tiny static server from the repo root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

## Monthly Workflow

The intended use is a simple monthly finance review:

1. Download the checking account CSV from the bank.
2. Open Finance Sorter locally.
3. Drop the CSV into the upload area.
4. Review category totals.
5. Assign uncategorized transactions.
6. Add custom keyword rules when a merchant should be categorized automatically next time.

Custom category rules are stored in the browser's `localStorage`, so they stay on the same browser/device.

## Maintenance Notes

Update these docs when the app changes in ways a future contributor or AI assistant should know about:

- New file structure or dependencies.
- New CSV formats or parsing behavior.
- New category rule behavior.
- Important bugs, assumptions, or decisions.
- Manual test steps that should be repeated after changes.

Do not commit real bank CSV files or private transaction data. Use fake samples when documenting parser behavior.
