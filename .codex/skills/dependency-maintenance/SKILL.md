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
- Target Node.js 22 for the browser toolchain and Firebase Cloud Functions runtime unless the user explicitly revises the runtime policy.
- Review upstream release notes for major, Firebase, React, TypeScript, react-scripts, or Cypress updates before applying them.
- Update `package-lock.json` with `package.json`; do not hand-edit lockfile content.
- Check root app dependencies separately from `functions` dependencies.
- Verify browser app changes with `npm test -- --watchAll=false`; use `npm run build` for dependency or TypeScript/toolchain changes.
- Call out migrations, deprecations, or follow-up risks in the final response.
