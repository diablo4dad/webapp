---
name: architecture
description: Architecture guidance for this React/Firebase repository. Use when adding features, refactoring, changing data flow, modifying persistence, routing, Firebase integration, or deciding where code belongs.
---

# Architecture

- Preserve the app shape: `src/app` composes providers and routing, `src/routes` owns route screens, `src/collection` owns collection UI, `src/data` owns catalog types and transforms, `src/store` owns persistence, `src/auth` owns authentication, and `functions` owns Firebase Cloud Functions.
- Prefer module/feature-based organization under `src`; keep feature-specific UI, state, and helpers near that feature, and use generalized modules such as `src/components`, `src/common`, `src/layout`, and `src/config` only for application-wide shared code.
- Keep view rendering and view behavior isolated when complexity grows: stateful route/container components or hooks should own data loading, context access, and event wiring, while sibling view components receive state and handlers through props.
- Use layout components for screen positioning, sizing, and page structure. Keep reusable components free of static page placement and dimensional assumptions; put those concerns in `src/layout`, route composition, or feature-level wrappers.
- Keep React component state local unless it is shared through an existing provider context.
- Keep catalog/data transformations pure where practical; isolate Firebase, localStorage, DOM, and upload side effects at module edges.
- Follow Twelve-Factor app principles for deploy-varying configuration: read service locators, feature flags, public client configuration, and secrets from environment/framework configuration rather than checked-in constants. Treat Firebase, storage, remote APIs, and other backing services as attached resources hidden behind config and adapters.
- Prefer small typed functions for reducers, predicates, getters, migrations, and persistence adapters.
- Keep browser app changes separate from Cloud Functions changes unless the behavior spans both.
- When paying down debt, separate mechanical moves, behavioral changes, dependency updates, and generated/static data refreshes into distinct commits.
- Document any new durable architectural rule in this skill or `AGENTS.md`.
