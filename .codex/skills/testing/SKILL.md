---
name: testing
description: Testing and verification workflow for this repository. Use when changing behavior, fixing bugs, refactoring, adding features, preparing commits, or deciding what validation is required.
---

# Testing

- Identify the smallest verification that can catch the changed risk.
- Current baseline for code behavior is `npm test`.
- Use `npm run check` before handing over dependency, toolchain, or broad refactor changes.
- Run focused Vitest tests first when a nearby test exists; broaden to the full test suite before finishing behavior changes.
- Use `npm run build` when touching app bootstrapping, routing, TypeScript boundaries, dependencies, production config, or Firebase integration.
- Use `npm run e2e` or browser verification for critical user workflows that Vitest does not cover; `npm run e2e` starts Vite and runs Cypress headless.
- Keep Cypress browser-exposed env disabled unless a test explicitly needs public, non-sensitive config.
- Keep tests close to pure logic where possible; isolate Firebase, localStorage, DOM size, and image-loading dependencies behind fixtures or existing boundaries.
- Do not use live Firebase writes, uploads, or local secrets as a substitute for tests.
- In the final response, state what ran and any remaining test gap.
