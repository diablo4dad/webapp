---
name: agent-instructions
description: Maintain repository agent guidance. Use when the user gives a firm directive for future work, asks to update AGENTS or skills, or a change reveals durable process guidance that future agentic coding should follow.
---

# Agent Instructions

## Placement

- Put durable repo-wide rules in `AGENTS.md`.
- Put repeatable task workflows in the closest `.codex/skills/<skill>/SKILL.md`.
- Prefer editing an existing skill when the scope fits.
- Create a new skill only for a repeated workflow with distinct ownership.

## Content

- Keep guidance short, imperative, and actionable.
- Record firm directives and repeatable lessons, not task narration.
- Do not record speculation, one-off preferences, or uncertain observations.
- Avoid duplicating guidance already covered by another skill or `AGENTS.md`.

## Skill Files

- Use lowercase hyphenated skill folder names.
- Keep `SKILL.md` frontmatter to `name` and `description`.
- Organize guidance under stable headings that can accept future bullets.

## Workflow

- Update guidance in the same clean commit that introduces the directive or lesson.
- Keep guidance-only edits separate from unrelated feature or dependency work.
