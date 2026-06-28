---
name: clean-commits
description: Clean commit preparation for agentic work. Use before committing, preparing a PR, summarizing changes, or deciding which files belong together.
---

# Clean Commits

- Start and end by checking `git status --short`.
- Keep commits scoped to one purpose: feature, fix, refactor, tests, docs/guidance, dependency update, or generated output.
- Do not include `.env.local`, function env files, Firebase debug logs, emulator state, `tmp`, `build`, `node_modules`, or unrelated IDE files.
- Before review or commit, stage all intentional newly-created repository files; add transient generated artifacts to `.gitignore` instead of leaving them as visible untracked noise.
- Preserve unrelated user changes; do not clean, reset, or reformat files outside the task.
- Include AGENTS/SKILL updates when the work introduced a firm future directive or repeatable process lesson.
- Run the relevant verification before considering the commit clean.
- Summarize changed files and verification honestly, including skipped checks.
