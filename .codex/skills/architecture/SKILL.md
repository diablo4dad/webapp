---
name: architecture
description: Architecture guidance for this React/Firebase repository. Use when adding features, refactoring, changing data flow, modifying persistence, routing, Firebase integration, or deciding where code belongs.
---

# Architecture

## Module Ownership

- `src/app`: provider composition and router setup.
- `src/routes`: route orchestration, route state, route loading, and screen composition.
- `src/<feature>`: feature-specific UI, state, domain helpers, skeletons, and tests.
- `src/data`: shared catalog types, getters, reducers, filters, factories, and transforms.
- `src/store`: localStorage, Firestore, catalog persistence, and persistence adapters.
- `src/auth`: authentication context and account/auth UI.
- `functions`: Firebase Cloud Functions.

## Feature Modules

- Prefer top-level feature modules under `src` for self-contained product surfaces.
- Keep feature UI, state, helpers, skeletons, and tests near the feature.
- Use `src/components`, `src/common`, and `src/config` only for app-wide shared code.
- Keep module internals shallow; add one lowercase hyphenated subdirectory per feature/workflow when several support files are needed.

## Routes

- Treat routes as orchestration boundaries, not feature owners.
- Use route submodules for route-local loaders, URL helpers, skeletons, state, views, and layouts.
- Keep `src/routes/root/route.tsx` as the root controller for auth, data, editor, and mobile shell state.
- Extract root route view/layout pieces only when they remove meaningful render or layout complexity.
- Prefer feature-based code splitting for routes and heavy feature surfaces when it reduces initial load without scattering ownership.
- Provide stable skeletons or fallbacks for lazy routes, async components, and data-loading surfaces.

## Controller, View, Layout

- Use a controller/view/layout split when UI complexity justifies it.
- Controllers own orchestration, context reads, state, effects, loaders, and event handlers.
- Views render from props and stay context-free where practical.
- Layouts own structural positioning, sizing, and page composition.
- Route controllers pass data, state, and handlers; views compose feature components into named layout slots.
- Do not pass concrete component instances from route controllers into views as generic slots.
- Keep reusable components free of static page placement and screen-size assumptions.

## State And Side Effects

- Keep React state local unless it is shared through an existing provider context.
- Call app context hooks at the lowest controller/container boundary that owns the behavior.
- Keep pure views, planners, reducers, selectors, predicates, getters, and adapters context-free.
- Keep catalog/data transformations pure where practical.
- Isolate Firebase, localStorage, DOM, upload, and remote API side effects at module edges.
- Read deploy-varying config from environment/framework configuration, not checked-in constants.

## Refactor Strategy

- Define the intended boundary before editing a broad refactor.
- Implement broad refactors in feature slices.
- Start with low-risk pure logic: typed helpers, tests, then controller/view/layout splits.
- Avoid app/provider/router rewiring unless the gate requires it.
- Keep browser app changes separate from Cloud Functions changes unless behavior spans both.
- Separate mechanical moves, behavior changes, tests, generated output, dependency work, and guidance updates when they can stand alone.

## Guidance

- Document new durable architectural rules in this skill or `AGENTS.md`.
- Keep architectural guidance operational and tied to ownership, boundaries, or verification.
