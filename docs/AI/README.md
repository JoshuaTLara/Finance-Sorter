# AI Handoff Docs

This folder keeps repo context available between AI sessions.

When a new AI assistant starts working in this repo, it should read:

1. `AGENT.md`
2. `docs/README.md`
3. `docs/AI/SESSION_CONTEXT.md`

## How To Use This Folder

Use `SESSION_CONTEXT.md` as the living handoff note. Keep it short, current, and practical. The goal is not to record every conversation. The goal is to preserve the facts that would slow down a future session if they were missing.

Good things to add:

- The current app goal.
- Important repo structure.
- Known quirks or bugs.
- User preferences.
- Recent changes and why they were made.
- Next useful tasks.

Avoid adding:

- Long chat transcripts.
- Temporary debugging noise.
- Secrets, account data, bank exports, or private financial data.

