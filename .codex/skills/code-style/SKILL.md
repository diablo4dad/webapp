---
name: code-style
description: Code style and TypeScript/React conventions for this repository. Use when editing TypeScript, React components, CSS modules, imports, tests, or creating new source files.
---

# Code Style

- Follow existing Vite, React 19, TypeScript strict-mode style.
- Use `.tsx` for React components and `.ts` for non-React logic.
- Prefer named exports for reusable logic unless nearby code uses a default export.
- Keep provider, reducer, predicate, getter, and persistence logic in their existing module families.
- Keep components readable: move complex derivations into named helpers when JSX becomes hard to scan.
- Use CSS modules for component-specific styles and existing shared components before adding new styling patterns.
- Preserve current formatting style in touched files; do not introduce repo-wide formatting churn.
- Prefer accessible controls with real buttons, labels, and keyboard behavior for interactive UI.
