# AGENTS.md

Guidelines for AI coding agents working in this repository. This project is a task/budget delegator for planning on-campus club events (see [PROPOSAL.md](PROPOSAL.md) and [DESIGN.md](DESIGN.md)). Data is currently stored client-side in `localStorage`, with no backend or authentication.

## Project Context

- Single-user, client-side web app (no server, no accounts) for now.
- Core entities: **events**, **tasks** (with owner, deadline, completion state), and **budgets** (SGA or OBI source, amount spent).
- Derived state matters: task completion must update progress bars, and budget entries must roll up into semester totals. Keep these calculations in one place rather than duplicating them per view.

## Core Principles

1. **Only build what's asked.** Don't add features, pages, or abstractions beyond the current request, even if they seem useful for later.
2. **Match existing patterns.** Before adding new code, look at how similar features (components, storage access, styling) are already implemented and follow the same conventions.
3. **Keep changes minimal and reviewable.** Prefer small, focused diffs over broad refactors. If a refactor seems necessary, call it out instead of doing it silently.
4. **Explain non-obvious choices** with a short comment; don't restate what the code already makes clear.

## Data Handling & Privacy

- All persisted data goes through a single storage access layer (e.g. one module wrapping `localStorage`) — do not call `localStorage` directly from components/pages.
- Never store secrets, tokens, or credentials in `localStorage`; there are none expected in this app's data model.
- Validate and sanitize any data read back from `localStorage` before rendering it (a corrupted or manually edited entry should not crash the app).
- When rendering user-entered text (task names, notes, event titles), rely on the framework's default escaping. Never use `innerHTML`/`dangerouslySetInnerHTML` with unsanitized user input.

## Security (OWASP-aligned)

- Treat all user input (task/budget/event fields) as untrusted: validate types, lengths, and numeric ranges (e.g. budget amounts must be non-negative numbers) before using them in calculations or storage.
- Avoid `eval`, dynamic `Function()`, or injecting strings into HTML/scripts.
- If a backend or API is introduced later, flag that auth, input validation, and CORS need explicit design — don't silently add network calls without discussing the security model first.
- Don't add third-party scripts/CDNs or dependencies without checking they're necessary and reasonably trustworthy.

## Code Quality

- Keep task/budget math (progress %, totals per budget source, per-semester totals) in pure, testable helper functions rather than inline in UI code.
- Use clear, descriptive names for state tied to the domain (`taskCount`, `completedCount`, `budgetSpent`) instead of generic names.
- Handle the empty/edge states explicitly: no events yet, an event with zero tasks, a budget with no entries.
- Don't add error handling for conditions that can't occur in this app (e.g. network failures) — this is a local-only app for now.

## Verification Before Finishing

- After generating or editing code, check for lint/type errors in the changed files.
- Manually trace through at least one realistic scenario (add a task → mark complete → confirm progress bar and totals update correctly) before considering a change done.
- Do not claim a UI change "works" without either running it or clearly stating it is unverified.

## Things to Avoid

- Don't introduce a backend, database, or auth system unless explicitly requested — the current design is local-only.
- Don't commit generated `image.png`-style assets or large binary files beyond what's already in the repo.
- Don't rewrite `DESIGN.md`, `PROPOSAL.md`, or `README.md` content unless asked; these capture the student author's own thinking for the assignment.
- Don't guess at missing requirements (e.g. exact progress-bar UI, task-list sorting) — ask or note the assumption explicitly instead of inventing unstated behavior.
