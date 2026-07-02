---
name: testing
description: Testing and verification workflow for this repository. Use when changing behavior, fixing bugs, refactoring, adding features, preparing commits, or deciding what validation is required.
---

# Testing

## Verification Scope

- Choose the smallest verification that catches the changed risk.
- Use focused checks first when nearby coverage exists.
- Broaden before handoff when behavior, module boundaries, dependencies, or toolchain behavior changed.

## Command Baselines

- Use `npm test` as the current baseline for code behavior.
- Use `npm run check` before handing over dependency, toolchain, or broad refactor changes.
- Use `npm run build` when touching app bootstrapping, routing, TypeScript boundaries, dependencies, production config, or Firebase integration.
- Use `npm run e2e` or browser verification for critical user workflows that Vitest does not cover.

## Lint

- Keep `npm run lint` non-mutating.
- Use `npm run lint:fix` only as the explicit lint cleanup shortcut.
- Review lint auto-fix edits, then rerun `npm run lint`.

## Test Placement

- Keep tests close to the pure logic or behavior they cover.
- Prefer tests around planners, reducers, selectors, predicates, adapters, and pure state helpers before component rewrites.
- Add characterization tests before splitting or moving risky modules.
- Treat large components, providers, persistence adapters, reducers, routing, and async loading flows as risky moves.
- Keep UI tests focused on behavior pure tests cannot cover.

## Test Style

- Prefer short behavioral test descriptions.
- Avoid implementation names in test titles unless they are the behavior users or callers observe.
- Use concise nested `describe` blocks for logic branches and `test`/`it` names for outcomes.

## Boundaries

- Isolate Firebase, localStorage, DOM size, image loading, and remote dependencies behind fixtures or existing boundaries.
- Do not use live Firebase writes, uploads, or local secrets as a substitute for tests.
- Keep Cypress browser-exposed env disabled unless a test explicitly needs public, non-sensitive config.

## Reporting

- State what verification ran in the final response.
- State skipped verification and remaining test gaps.
