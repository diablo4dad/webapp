---
name: code-style
description: Code style and TypeScript/React conventions for this repository. Use when editing TypeScript, React components, CSS modules, imports, tests, or creating new source files.
---

# Code Style

- Follow existing Vite, React 19, TypeScript strict-mode style.
- Use `.tsx` for React components and `.ts` for non-React logic.
- Prefer named exports for reusable logic unless nearby code uses a default export.
- Keep provider, reducer, predicate, getter, and persistence logic in their existing module families.
- Prefer small single-file React components over large monoliths; split by responsibility before adding more behavior to an already large component.
- Keep components readable: move complex derivations into named helpers when JSX becomes hard to scan.
- Keep render components pure where practical: pass data, derived state, and event handlers through props instead of reading context, loading data, or performing persistence from the view.
- Use CSS modules for component-specific styles and existing shared components before adding new styling patterns.
- Keep reusable component CSS focused on the component's own appearance and intrinsic affordances. Put screen positioning, page sizing, and fixed layout constraints in layout components or parent wrappers.
- Preserve current formatting style in touched files; do not introduce repo-wide formatting churn.
- Prefer accessible controls with real buttons, labels, and keyboard behavior for interactive UI.
