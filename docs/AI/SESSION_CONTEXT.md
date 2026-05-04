# AI Session Context

Last updated: 2026-05-04

## Current Repo Purpose

Finance Sorter is a local, browser-only CSV expense sorter. The user imports a bank CSV, and the app groups transactions by category using built-in and custom keyword rules.

The user cares about keeping the project understandable across AI sessions, so documentation should stay clear and up to date as work continues.

For product direction and emotional context, read `docs/PROJECT_PURPOSE.md`. This app came from the user's monthly household finance routine: replacing printed transaction lists, manual categorization, whiteboard totals, and 1-2 hours of repetitive work with a faster private browser tool.

## Current File Structure

- `index.html`: Static page shell, inline CSS, upload/drop zone, instructions, and script tags.
- `categories.js`: Built-in keyword category map exposed as `window.CATEGORIES`.
- `script.js`: Main app logic.
- `docs/README.md`: Documentation index.
- `docs/PROJECT_PURPOSE.md`: Purpose, origin, product values, and future-session guidance.
- `docs/CSV_FORMATS.md`: Supported bank CSV layouts and parser mappings.
- `docs/AI/README.md`: Instructions for AI handoff docs.
- `docs/AI/SESSION_CONTEXT.md`: This living context file.
- `AGENT.md`: Agent operating guide.

## App Behavior

- CSV files are parsed in the browser with PapaParse loaded from jsDelivr.
- The app detects supported CSV shapes in `detectProfile`.
- Rows are normalized to `{ Date, Amount, Description }`.
- Positive amounts are categorized as `Income`.
- Negative amounts are matched against category keywords.
- Custom keyword rules are stored in `localStorage` under `customCategories`.
- The last normalized import is stored in `localStorage` under `last-transactions`.
- Users can select transactions and assign them to categories.
- Users can optionally create a keyword rule that applies to all matching transactions in the current file.

## Supported CSV Profiles

Current detection supports:

- A legacy Wells Fargo 5-column no-header format described in code as `YourBank_NoHeader_5Cols`.
- The current Wells Fargo checking export with headers: `DATE`, `DESCRIPTION`, `AMOUNT`, `CHECK #`, `STATUS`.
- US Bank CSVs with headers.
- US Bank body rows without headers.

Unknown CSVs fall back to a best-effort mapping.

## Recent Changes

- 2026-05-04: Added support for the newer Wells Fargo checking CSV layout after Wells Fargo changed its export format. The new layout has headers and maps date from column 0, description from column 1, and amount from column 2.
- 2026-05-04: Added documentation for supported CSV layouts, local testing, and privacy rules for real bank exports.
- 2026-05-04: Added a small privacy-focused `.gitignore` that ignores real financial exports while allowing intentional fake samples in `docs/samples/`.
- 2026-05-04: Added `docs/PROJECT_PURPOSE.md` to preserve the app's origin, privacy-first values, monthly household finance workflow, and future product direction.

## Local Testing Notes

The app can be served locally from the repo root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/index.html`.

A server was previously started on port `8000` during the Wells Fargo layout fix. If that port is busy in a later session, use another local port.

## Known Quirks

- `index.html` currently places the instructions block after the closing `</body>` tag. Browsers tolerate this, but it should be cleaned up during a UI pass.
- Some emoji characters displayed incorrectly in earlier reads, likely because of encoding display issues in the terminal. Confirm in browser before changing visible copy.
- Keyword matching is mostly word-boundary based. Be careful with merchant names that include punctuation or short tokens.
- There are no automated tests yet.

## Working Preferences

- Keep the app browser-only unless the user asks for a backend or build system.
- Keep edits small and easy to understand.
- Prefer clear documentation over heavy process.
- Do not include real bank data, account numbers, or private transaction exports in the repo.

## Useful Manual Test

After changing app behavior:

1. Open `index.html` in a browser.
2. Upload or drop a representative CSV.
3. Confirm transactions parse into date, amount, and description.
4. Confirm categories and summary totals look right.
5. Try assigning a selected transaction to an existing category.
6. Try creating a custom keyword rule.
7. Reload and confirm custom rules still apply from `localStorage`.

## Next Likely Improvements

- Clean up `index.html` structure.
- Add a small sample CSV with fake data for testing.
- Add a reset/export/import option for custom category rules.
- Improve UI layout and mobile behavior.
- Add lightweight automated tests for normalization and categorization helpers.
