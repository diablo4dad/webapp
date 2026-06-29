---
name: dependency-maintenance
description: Dependency and toolchain maintenance workflow. Use when updating npm packages, changing React, react-scripts, TypeScript, Firebase, Cypress, Cloud Functions, or package-lock files.
---

# Dependency Maintenance

- Treat dependency changes as their own commit unless they are required by the active fix.
- Check currently installed and locked versions before changing package ranges.
- Keep `dependencies` limited to runtime app libraries; put test, type, lint, build, analysis, and local tooling packages in `devDependencies`.
- Keep package entries alphabetized within each dependency group.
- Prefer incremental toolchain migrations with an explicit user evaluation gate after each phase.
- Apply audit fixes incrementally: run non-forced fixes first, and treat forced major upgrades as separate review gates.
- Treat Oxlint as an evaluated lint layer until explicitly promoted; do not remove other quality gates just because Oxlint passes.
- Preserve Oxlint's intended rule surface during upgrades; evaluate newly default plugins or noisy rules in separate cleanup gates.
- Target Node.js 22 and raise the minor or patch floor when a maintained dependency or Firebase explicitly requires it.
- Review upstream release notes for major, Firebase, React, TypeScript, react-scripts, or Cypress updates before applying them.
- Update `package-lock.json` with `package.json`; do not hand-edit lockfile content.
- Check root app dependencies separately from `functions` dependencies.
- Verify dependency or toolchain changes with `npm run check` unless the user asks for a narrower gate.
- Call out migrations, deprecations, or follow-up risks in the final response.
