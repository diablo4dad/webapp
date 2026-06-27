---
name: architecture
description: Architecture guidance for this React/Firebase repository. Use when adding features, refactoring, changing data flow, modifying persistence, routing, Firebase integration, or deciding where code belongs.
---

# Architecture

- Preserve the app shape: `src/app` composes providers and routing, `src/routes` owns route screens, `src/collection` owns collection UI, `src/data` owns catalog types and transforms, `src/store` owns persistence, `src/auth` owns authentication, and `functions` owns Firebase Cloud Functions.
- Keep React component state local unless it is shared through an existing provider context.
- Keep catalog/data transformations pure where practical; isolate Firebase, localStorage, DOM, and upload side effects at module edges.
- Prefer small typed functions for reducers, predicates, getters, migrations, and persistence adapters.
- Keep browser app changes separate from Cloud Functions changes unless the behavior spans both.
- When paying down debt, separate mechanical moves, behavioral changes, dependency updates, and generated/static data refreshes into distinct commits.
- Document any new durable architectural rule in this skill or `AGENTS.md`.
