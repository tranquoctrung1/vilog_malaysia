---
name: feature-dev-orchestrator
description: Orchestrates backend-engineer, frontend-engineer, and qa-reviewer to build, modify, or verify features in the node_malaysia water-utility app (Express/Mongoose/Pug/MQTT). Use for "add a new page/report/dashboard/alarm", "fix this feature end to end", "redo X", "rerun QA on Y", or any multi-file feature request touching both backend and frontend. For a pure backend-only or frontend-only one-file edit, the relevant single agent/skill may be used directly without full orchestration.
---

# Feature Dev Orchestrator (node_malaysia)

**Execution mode:** Sub-agent pattern (not agent-team). This environment has no `TeamCreate`/`SendMessage`/`TaskCreate` tools — only the `Agent` tool is available, so coordination happens through the orchestrator dispatching `Agent` calls and relaying results, not through agents messaging each other directly.

## Phase 0: Context check

Before doing anything, check `_workspace/` in the project root (create if a multi-step feature is starting):
- `_workspace/` absent → **initial run**, fresh feature.
- `_workspace/` present + user asks to redo/fix part of it → **partial rerun**, only re-dispatch the affected agent(s), reusing prior `_workspace` files as context.
- `_workspace/` present + user gives a new unrelated feature request → move existing `_workspace/` to `_workspace_prev/`, start fresh.

## Phase 1: Scope the request

Decide which agents are actually needed:
- Backend-only change (model/controller/router/middleware/mqtt, no UI) → `backend-engineer` only, then `qa-reviewer`.
- Frontend-only change (pure view/style tweak, no new data) → `frontend-engineer` only, then `qa-reviewer`.
- Full feature (new page with new data) → all three, in the order below.

## Phase 2: Dispatch backend-engineer

Call `Agent` with `subagent_type` matching the `backend-engineer` agent definition (`.claude/agents/backend-engineer.md`), `model: "opus"`. Prompt must include:
- The feature requirement in plain terms.
- Pointer to `express-mvc-pattern` and (if telemetry/MQTT involved) `mqtt-realtime-pattern` skills.
- Instruction to write the exact `res.render`/`res.json` data shape to `_workspace/01_backend_api_shape.md` when done, plus a list of files changed.

## Phase 3: Dispatch frontend-engineer (if scoped in)

Call `Agent` for `frontend-engineer`, `model: "opus"`. Prompt includes:
- The UI requirement.
- The contents of `_workspace/01_backend_api_shape.md` (read it and paste the relevant shape into the prompt — sub-agents don't share file access context automatically across calls unless told the exact path to read).
- Pointer to `pug-frontend-pattern` skill.
- Instruction to write files changed + any socket/event names consumed to `_workspace/02_frontend_files.md`.

Backend and frontend can run as parallel `Agent` calls only when the API shape is already fully known upfront (e.g. reusing an existing endpoint) — otherwise run backend first since frontend depends on its output.

## Phase 4: Dispatch qa-reviewer

Call `Agent` for `qa-reviewer`, `model: "opus"`. Prompt includes:
- Full list of files changed from `_workspace/01_*.md` and `_workspace/02_*.md`.
- Pointer to `integration-qa` skill.
- Instruction to return a PASS/FAIL list per check.

## Phase 5: Resolve QA findings

- Any FAIL → re-dispatch the owning agent (backend or frontend) with the specific mismatch, once.
- Still failing after 1 retry → report the unresolved issue to the user instead of looping further.
- All PASS → summarize files changed and report done.

## Error handling

- If an agent call returns an unclear/incomplete result, retry once with a more specific prompt before escalating to the user.
- Conflicting information between backend and frontend reports (e.g. shape mismatch) is surfaced to the user, not silently resolved by guessing which side is right.

## Test scenarios

- **Normal flow**: "Add a new dashboard page showing average pressure per site over the last 7 days." → backend-engineer adds controller/router/model query + registers route → frontend-engineer builds `.pug` + chart script consuming the shape → qa-reviewer checks route registration, permission entry, data-shape match → all PASS → done.
- **Error flow**: qa-reviewer finds controller passes `avgPressure` but view reads `averagePressure` → orchestrator re-dispatches frontend-engineer (or backend-engineer) with that exact mismatch → re-check → PASS.
