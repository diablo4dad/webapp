---
name: agent-instructions
description: Maintain repository agent guidance. Use when the user gives a firm directive for future work, asks to update AGENTS or skills, or a change reveals durable process guidance that future agentic coding should follow.
---

# Agent Instructions

- Put durable repo-wide rules in `AGENTS.md`.
- Put task-specific repeatable workflows in the closest `.codex/skills/<skill>/SKILL.md`.
- Update guidance in the same clean commit that introduces the directive or lesson.
- Keep entries short, imperative, and actionable.
- Do not encode one-off task notes, uncertain observations, or preferences the user has not made firm.
- Prefer editing an existing skill over creating a new one when the scope fits.
- If creating a skill, use lowercase hyphenated folder names and a `SKILL.md` with only `name` and `description` frontmatter.
