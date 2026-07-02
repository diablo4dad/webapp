---
name: clean-commits
description: Clean commit preparation for agentic work. Use before committing, preparing a PR, summarizing changes, or deciding which files belong together.
---

# Clean Commits

## Status

- Start by checking `git status --short`.
- End by checking `git status --short`.
- Preserve unrelated user changes.
- Do not clean, reset, revert, or reformat files outside the task.

## Scope

- Keep each commit scoped to one purpose: feature, fix, refactor, tests, docs/guidance, dependency update, or generated output.
- Treat broad refactors as explicit gates.
- State each gate's module/workflow, intended boundary, risk, and verification before editing.
- Record follow-up gates instead of opportunistically refactoring adjacent modules.

## Commit Boundaries

- Separate mechanical moves, import rewrites, behavior changes, test additions, dependency removals, and guidance updates when they can stand alone.
- Combine changes only when they are inseparable for the active gate.
- Include AGENTS/SKILL updates when the work introduced a firm future directive or repeatable process lesson.

## Worktree Hygiene

- Do not commit `.env.local`, function env files, Firebase debug logs, emulator state, `tmp`, `build`, `node_modules`, or unrelated IDE files.
- Stage intentional new repository files once they are part of the active gate.
- Add transient generated artifacts to `.gitignore` instead of leaving visible untracked noise.

## Verification And Handoff

- Run the relevant verification before considering the commit clean.
- Summarize changed files and verification honestly.
- Call out skipped checks and residual risk.
