# Agent Guide

This file is for AI coding agents and human contributors working in this repository.

## Start Here

Before making changes, read:

1. `docs/README.md`
2. `docs/PROJECT_PURPOSE.md`
3. `docs/AI/SESSION_CONTEXT.md`
4. The files you plan to edit

This repo is intentionally small. Favor direct, readable changes over new framework, build, or tooling layers unless the user asks for them.

## Repo Overview

Finance Sorter is a static browser app for sorting bank CSV transactions.

- `index.html` is the browser entry point.
- `categories.js` defines default category keyword rules.
- `script.js` handles parsing, normalization, categorization, reassignment, and rendering.
- `docs/PROJECT_PURPOSE.md` explains why the app exists and what values to preserve.
- `docs/CSV_FORMATS.md` documents supported bank CSV layouts.
- `docs/AI/SESSION_CONTEXT.md` should be updated when project context changes.

## Coding Guidelines

- Keep the app runnable as static files.
- Avoid committing private financial data or real bank exports.
- Preserve the privacy-first design. Do not add data collection casually.
- Keep category keywords uppercase for consistency.
- Preserve browser-only behavior unless a task explicitly changes that direction.
- Use small helper functions when they make parsing or matching behavior easier to test.
- Update docs when behavior or structure changes.

## Verification

There is currently no automated test suite. For now, verify changes manually in the browser:

1. Start a local static server if useful:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

2. Load `http://127.0.0.1:8000/index.html`.
3. Import a CSV with fake, redacted, or otherwise safe data.
4. Confirm CSV profile detection still works.
5. Confirm totals and category grouping are correct.
6. Confirm custom category rules persist after reload.

Before changing parser behavior, read `docs/CSV_FORMATS.md`.

When inspecting real bank files, redact output and do not add those files to the repository.

If tests are added later, document the command here and in `docs/README.md`.

## AI Handoff Rule

When an AI session makes a meaningful change, update `docs/AI/SESSION_CONTEXT.md` with:

- What changed.
- Any new assumptions.
- Any known issue discovered.
- The next useful task if obvious.
