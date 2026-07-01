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
- Keep provider, reducer, predicate, getter, and persistence logic in their existing module families.
- Prefer small single-file React components over large monoliths; split by responsibility before adding more behavior to an already large component.
- Keep tightly coupled one-off child render components in the parent file when they only support that view. Extract them to sibling files only when reuse, size, testing, async loading, or distinct ownership justifies the file boundary.
- Keep components single-responsibility; build larger feature experiences through composition instead of accumulating unrelated state, effects, and markup in one component.
- Keep components readable: move complex derivations into named helpers when JSX becomes hard to scan.
- Keep render components pure where practical: pass data, derived state, and event handlers through props instead of reading context, loading data, or performing persistence from the view.
- Use CSS modules for component-specific styles and existing shared components before adding new styling patterns.
- Prefer self-authored components and existing local primitives before adding UI libraries; reach for a library only when accessibility, positioning, virtualization, parsing, or other complexity justifies the dependency.
- Keep reusable component CSS focused on the component's own appearance and intrinsic affordances. Put screen positioning, page sizing, and fixed layout constraints in layout components or parent wrappers.
- Preserve current formatting style in touched files; do not introduce repo-wide formatting churn.
- Prefer accessible controls with real buttons, labels, and keyboard behavior for interactive UI.
