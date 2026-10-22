# PRD: Club Event Task & Budget Delegator

## Goal

Give a campus club leader a single page where adding, completing, or deleting a task updates that event's progress bar, and logging a budget amount updates both the event's spend and the semester-wide SGA/OBI totals — all client-side, no server.

## Audience and key action

- **Audience:** A single user (the club leader, e.g. Babson MSA e-board) using their own browser. No multi-user support, no accounts.
- **Key action:** See every event's task-completion % at a glance, and drill into any one event (expand its card) to add/check off tasks and log budget spend.

## Features (Version 1)

One page, no routing. Sections, top to bottom:

1. **Semester totals bar** — read-only summary: total spent from SGA, total spent from OBI, combined total. Recalculated from all events' logged spend.
2. **Add Event form** — fields: event name (text, required), status (dropdown: Planning / Active / Done). Submitting adds a new event card with 0 tasks and $0 spent.
3. **Event list** — one card per event, each showing:
   - Name and status
   - Progress bar + fraction (e.g. "2/5 tasks done") based on completed vs total tasks
   - Event spend total (SGA + OBI breakdown)
   - Expand/collapse toggle (button) to reveal the event's detail panel
4. **Event detail panel** (per expanded event):
   - **Task list**: add-task form (task name text input, owner text input, deadline date input), checkbox per task to mark complete/incomplete, delete button per task. Progress bar updates immediately on add/complete/delete.
   - **Budget log form**: amount (number input, non-negative) + source (dropdown: SGA / OBI). Submitting adds to that event's spend and the semester totals. No per-task line items in V1 — one running total per source per event.
5. **Reset button** — clears all events/tasks/budgets from localStorage and returns the page to the empty state without a page reload.

Interaction types covered: button (toggle/delete/reset), form (add event, add task, log budget), dropdown (status, budget source), checkbox (task complete).

## Content and data

- **Have:** task fields (name, owner, deadline, done flag), budget sources fixed to SGA/OBI, progress-bar logic described in [Proposal.md](Proposal.md).
- **Missing — from the user (you), entered live when using the tool:** actual event names, real task lists/owners/deadlines, real dollar amounts spent. None of this is invented or pre-filled; the app starts empty and you populate it yourself.

## Look

Follow the palette and style already defined in [DESIGN.md](DESIGN.md); do not restate its values here.

## States

- **Ideal:** at least one event exists with a mix of complete/incomplete tasks and some budget logged; totals bar shows non-zero sums; progress bars reflect real fractions.
- **Empty:** no events yet (including right after Reset) — totals bar shows $0 / $0 / $0, event list area shows a message like "No events yet — add one above," Add Event form is still usable.
- **Error (invalid input):** e.g. empty event/task name submitted, or a negative/non-numeric budget amount — the form shows an inline message explaining what's wrong, the bad input is not added to state, and the rest of the page keeps working.
- **Partial:** an event exists but has zero tasks (progress bar shows "0/0", not broken math), or has tasks but no budget logged yet (spend shows $0), or has budget but no tasks yet.
- *(Loading state omitted — all data loads synchronously from localStorage on page open; there is no network or async delay to show a loading state for.)*

## Checks

1. Add an event — it appears in the list at 0% progress with $0 spend.
2. Add a task to an event, check it complete, then delete a different task — the progress bar and fraction update correctly after each action.
3. Log a budget amount against SGA for one event and OBI for another — both the event totals and the semester totals bar update correctly.
4. Submit an empty task name or a negative budget amount — see an inline error, and confirm the page keeps working (no crash, no `alert()`).
5. Click Reset — the page returns to the empty state immediately, without a browser reload.

## Out of scope

- Multiple users, accounts, or logins.
- Server, database, or outside API calls.
- Per-task (line-item) budget entries — V1 only tracks one running total per source per event.
- A calendar view or event due-date field.
- Separate pages/routes for event detail (handled via expand/collapse on one page).
- Social media graphics/images per event card.

## Later

- Line-item budget entries tied to individual tasks, instead of one running total per source.
- Event due dates and a calendar/"what's on deck" view.
- Multi-user support (would require real auth/backend — flagged, not assumed here).
- Event cards with images/social graphics (per your Design inspo).
- Sorting/filtering the task list (e.g. by owner or deadline).
