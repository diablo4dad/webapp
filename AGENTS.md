# Agent Instructions

This repository is being brought back to health incrementally. Favor technical precision, maintainability, and clear verification over feature velocity.

## How To Work

- Read this file and the relevant repo skills in `.codex/skills/*/SKILL.md` before non-trivial changes.
- Inspect nearby code before editing; follow existing module boundaries and patterns unless the task is to change them.
- Keep changes narrow and commit-sized. Do not mix feature work, refactors, generated output, and dependency upgrades unless the user asks.
- Preserve user work. Do not revert unrelated dirty files or local artifacts.
- Treat `.env.local`, function env files, Firebase debug logs, `tmp`, `build`, emulator state, and local IDE files as local-only unless the user explicitly says otherwise.

## Maintaining Agent Guidance

- When the user gives a firm directive for future agent work, codify it in `AGENTS.md` or the most relevant skill in the same clean commit.
- Keep guidance concise and operational. Do not record speculation, one-off preferences, or task narration.
- Add new skills only when repeated workflows need durable instructions.

## Verification

- Run the smallest meaningful verification for each change.
- Current baseline for behavior changes: `npm test -- --watchAll=false`.
- Use `npm run build` when touching routing, app bootstrapping, TypeScript boundaries, dependencies, or production-facing behavior.
- Use Cypress or a browser check when changing core UI workflows.
- Report any verification skipped and why.

## Repo Skills

- `.codex/skills/agent-instructions/SKILL.md`
- `.codex/skills/architecture/SKILL.md`
- `.codex/skills/clean-commits/SKILL.md`
- `.codex/skills/code-style/SKILL.md`
- `.codex/skills/dependency-maintenance/SKILL.md`
- `.codex/skills/testing/SKILL.md`
