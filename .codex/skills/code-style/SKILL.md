---
name: code-style
description: Code style and TypeScript/React conventions for this repository. Use when editing TypeScript, React components, CSS modules, imports, tests, or creating new source files.
---

# Code Style

- Follow existing Vite, React 19, TypeScript strict-mode style.
- Use `.tsx` for React components and `.ts` for non-React logic.
- Prefer lowercase kebab-case file and folder names for new modules. Use short, broad names when the parent folder supplies context, avoid repeating parent context in filenames, and reserve PascalCase filenames for a deliberate compatibility reason.
- In complex UI modules, prefer conventional file names such as `route.tsx`, `view.tsx`, `layout.tsx`, `state.ts`, `links.ts`, and `loading.ts` when the parent folder supplies the feature context.
- Prefer named exports for reusable logic unless nearby code uses a default export.
- Order top-level declarations after imports as types/interfaces/enums first, then constants/static maps, then functions/components/hooks. Within functions/components, put the public entrypoint first and local helpers after it in reading order. Preserve required framework or test setup ordering, such as `vi.hoisted` and `vi.mock`, when runtime behavior depends on it.
- Group top-level constants by logical naming family. Keep related prefixes or suffixes contiguous, such as `DEFAULT_*` constants together and `*_SLUG` constants together; place dependency constants before aliases that reference them.
- Use `npm run lint:fix` for Oxlint auto-fixes; manually correct remaining Oxlint violations that cannot be resolved by `--fix`.
- Do not bulk-normalize existing modules solely for export grouping; apply Oxlint's grouped, bottom-of-file export style to source files as they are touched for active work.
- Keep provider, reducer, predicate, getter, and persistence logic in their existing module families.
- Prefer small single-file React components over large monoliths; split by responsibility before adding more behavior to an already large component.
- Keep tightly coupled one-off child render components in the parent file when they only support that view. Extract them to sibling files only when reuse, size, testing, async loading, or distinct ownership justifies the file boundary.
- Keep components single-responsibility; build larger feature experiences through composition instead of accumulating unrelated state, effects, and markup in one component.
- Keep components readable: move complex derivations into named helpers when JSX becomes hard to scan.
- Keep render components pure where practical: pass data, derived state, and event handlers through props instead of reading context, loading data, or performing persistence from the view.
- Use CSS modules for component-specific styles and existing shared components before adding new styling patterns.
- Keep CSS modules self-contained: a module should style the owning component and only tightly coupled private subcomponents; move shared layout, placement, and reusable primitives to the appropriate layout or component module.
- Name CSS module classes with the UpperCamelCase module filename as the first segment, then append hierarchical role segments in reading order. For example, `layout.module.css` uses `Layout`, `LayoutHeading`, and `LayoutHeadingTitle`; `header.module.css` uses `HeaderLogo`.
- Keep CSS class hierarchy shallow and meaningful. CSS modules scope class names, so omit route or feature prefixes such as `Root` or `CollectionLog` unless they disambiguate multiple owners in the same CSS module; avoid naming by incidental DOM tags, colors, or implementation details.
- Group CSS properties by purpose: positioning and stacking, layout/display, box model and sizing, visual treatment, typography, interaction/state, then animation/transition. Use that order when editing a rule, without reordering untouched CSS solely for churn.
- Prefer self-authored components and existing local primitives before adding UI libraries; reach for a library only when accessibility, positioning, virtualization, parsing, or other complexity justifies the dependency.
- Keep reusable component CSS focused on the component's own appearance and intrinsic affordances. Put screen positioning, page sizing, and fixed layout constraints in layout components or parent wrappers.
- Preserve current formatting style in touched files; do not introduce repo-wide formatting churn.
- Prefer accessible controls with real buttons, labels, and keyboard behavior for interactive UI.
