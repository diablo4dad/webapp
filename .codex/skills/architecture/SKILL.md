---
name: architecture
description: Architecture guidance for this React/Firebase repository. Use when adding features, refactoring, changing data flow, modifying persistence, routing, Firebase integration, or deciding where code belongs.
---

# Architecture

- Preserve the app shape: `src/app` composes providers and routing, `src/routes` owns route screens, `src/collection` owns collection UI, `src/data` owns catalog types and transforms, `src/store` owns persistence, `src/auth` owns authentication, and `functions` owns Firebase Cloud Functions.
- Prefer module/feature-based organization under `src`; most features should be top-level modules with feature-specific UI, state, and helpers kept near that feature. Use generalized modules such as `src/components`, `src/common` and `src/config` only for application-wide shared code.
- Keep module internals shallow. When any feature or workflow needs several support files, use a lowercase hyphenated subdirectory named for that feature/workflow and place its helpers, hooks, views, skeletons, and tests there; avoid deeper hierarchies unless ownership would otherwise be unclear.
- Treat `src/routes` as route orchestration. Routes may use self-contained route submodules more often than other areas because loaders, URL helpers, skeletons, route containers, and views commonly need to be split while remaining route-local.
- Keep `src/routes/root/route.tsx` as the root route controller for auth, data, editor, and mobile shell state; extract route-local view or layout pieces only when they remove meaningful render or layout complexity.
- Prefer feature-based code splitting for routes and heavy feature surfaces when it reduces initial load size without scattering ownership.
- Provide skeleton loaders or equivalent stable fallbacks for lazy routes, async components, and data-loading feature surfaces.
- Keep view rendering and view behavior isolated when complexity grows: stateful route/container components or hooks should own data loading, context access, and event wiring, while sibling view components receive state and handlers through props.
- Call app context hooks at the lowest controller/container boundary that owns the behavior. Keep pure views, layout components, planners, reducers, and selectors context-free; pass dependencies as parameters unless a custom hook's purpose is to own that context integration.
- Prefer a controller/view/layout hierarchy for complex UI modules: the controller component owns orchestration, state, context, effects, loaders, and event handlers; the view component renders from props; the layout component owns structural positioning and sizing.
- For routes, `route.tsx` is the controller entrypoint by default. For non-route features, choose a domain name for the controller but keep the same controller/view/layout separation when complexity justifies it.
- Use layout components for screen positioning, sizing, and page structure. Keep reusable components free of static page placement and dimensional assumptions; put those concerns in route composition or feature-level wrappers.
- Keep React component state local unless it is shared through an existing provider context.
- Keep catalog/data transformations pure where practical; isolate Firebase, localStorage, DOM, and upload side effects at module edges.
- Follow Twelve-Factor app principles for deploy-varying configuration: read service locators, feature flags, public client configuration, and secrets from environment/framework configuration rather than checked-in constants. Treat Firebase, storage, remote APIs, and other backing services as attached resources hidden behind config and adapters.
- Prefer small typed functions for reducers, predicates, getters, migrations, and persistence adapters.
- Prefer composition over monolithic feature components; assemble large features from focused components, hooks, reducers, and layout primitives.
- For broad refactors, plan top-down but implement in feature slices. Define the intended boundary first, then refactor one module or workflow at a time.
- Within a refactor slice, work from low-risk pure logic upward: extract typed helpers, add tests, then split container/view behavior, layout wrappers, async loading, and app-level composition only as needed.
- Avoid starting broad refactors by rewiring `src/app`, providers, or routing unless the gate specifically requires it; app-level changes have high blast radius and should follow clearer feature boundaries.
- Keep browser app changes separate from Cloud Functions changes unless the behavior spans both.
- When paying down debt, separate mechanical moves, behavioral changes, dependency updates, and generated/static data refreshes into distinct commits.
- Document any new durable architectural rule in this skill or `AGENTS.md`.
