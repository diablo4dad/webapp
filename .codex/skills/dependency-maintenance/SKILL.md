---
name: dependency-maintenance
description: Dependency and toolchain maintenance workflow. Use when updating npm packages, changing React, react-scripts, TypeScript, Firebase, Cypress, Cloud Functions, or package-lock files.
---

# Dependency Maintenance

## Scope

- Treat dependency changes as their own commit unless required by the active fix.
- Keep root app dependencies separate from `functions` dependencies.
- During refactors, record redundant packages or duplicate helper code as separate cleanup gates.

## Package Placement

- Keep `dependencies` limited to runtime app libraries.
- Put test, type, lint, build, analysis, and local tooling packages in `devDependencies`.
- Keep package entries alphabetized within each dependency group.
- Prefer self-authored code and existing local primitives before adding runtime dependencies.
- Add a package only when it justifies its bundle, maintenance, accessibility, or correctness cost.

## Version Changes

- Check installed and locked versions before changing package ranges.
- Review upstream release notes for major, Firebase, React, TypeScript, react-scripts, or Cypress updates.
- Target Node.js 22; raise the minor or patch floor only when a maintained dependency or Firebase requires it.
- Update `package-lock.json` with `package.json`.
- Do not hand-edit lockfile content.

## Upgrades And Audits

- Prefer incremental toolchain migrations with an explicit user evaluation gate after each phase.
- Apply audit fixes incrementally.
- Run non-forced audit fixes first.
- Treat forced major upgrades as separate review gates.

## Removal

- Remove unused packages from both `package.json` and `package-lock.json`.
- Verify no imports remain before handing over.

## Oxlint

- Treat Oxlint as an evaluated lint layer until explicitly promoted.
- Do not remove other quality gates just because Oxlint passes.
- Preserve Oxlint's intended rule surface during upgrades.
- Evaluate newly default plugins or noisy rules in separate cleanup gates.

## Verification And Handoff

- Verify dependency or toolchain changes with `npm run check` unless the user asks for a narrower gate.
- Call out migrations, deprecations, and follow-up risks in the final response.
