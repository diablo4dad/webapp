---
name: clean-commits
description: Clean commit preparation for agentic work. Use before committing, preparing a PR, summarizing changes, or deciding which files belong together.
---

# Clean Commits

- Start and end by checking `git status --short`.
- Keep commits scoped to one purpose: feature, fix, refactor, tests, docs/guidance, dependency update, or generated output.
- Treat broad refactors as a sequence of explicit gates. State the gate's module/workflow, intended boundary, risk, and verification before editing.
- Keep mechanical moves, import rewrites, behavior changes, test additions, dependency removals, and guidance updates in separate commits unless they are inseparable for the gate.
- Do not opportunistically refactor adjacent modules because they are visible; record follow-up gates instead.
- Do not include `.env.local`, function env files, Firebase debug logs, emulator state, `tmp`, `build`, `node_modules`, or unrelated IDE files.
- Before review or commit, stage all intentional newly-created repository files; add transient generated artifacts to `.gitignore` instead of leaving them as visible untracked noise.
- Preserve unrelated user changes; do not clean, reset, or reformat files outside the task.
- Include AGENTS/SKILL updates when the work introduced a firm future directive or repeatable process lesson.
- Run the relevant verification before considering the commit clean.
- Summarize changed files and verification honestly, including skipped checks.
