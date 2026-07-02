---
name: code-style
description: Code style and TypeScript/React conventions for this repository. Use when editing TypeScript, React components, CSS modules, imports, tests, or creating new source files.
---

# Code Style

## Baseline

- Follow the existing Vite, React 19, and TypeScript strict-mode style.
- Use `.tsx` for React components and `.ts` for non-React logic.
- Preserve local formatting in touched files; avoid repo-wide formatting churn.
- Keep provider, reducer, predicate, getter, and persistence logic in their established module families.

## Files And Folders

- Prefer lowercase kebab-case file and folder names for new modules.
- Use short, broad file names when the parent folder supplies context.
- Avoid repeating the parent or feature name in child filenames.
- Reserve PascalCase filenames for deliberate compatibility reasons.
- In complex UI modules, prefer conventional names such as `route.tsx`, `view.tsx`, `layout.tsx`, `state.ts`, `links.ts`, and `loading.ts`.

## Exports And Names

- Prefer named exports for reusable logic unless nearby code uses default exports.
- Inside a feature or route module, omit parent/module prefixes unless the symbol is consumed externally or prevents a real collision.
- Keep private module-scoped types short when file context is enough, such as `Props`, `Options`, or `State`.
- Apply grouped, bottom-of-file export style to source files as they are touched.
- Do not bulk-normalize exports outside the active work.

## Declaration Order

- Order top-level declarations after imports as types/interfaces/enums, constants/static maps, then functions/components/hooks.
- Group constants by logical naming family, such as `DEFAULT_*` or `*_SLUG`.
- Put dependency constants before aliases that reference them.
- Within functions/components, put the public entrypoint first and local helpers after it in reading order.
- Preserve runtime-sensitive test/mock ordering such as `vi.hoisted` and `vi.mock`.

## React Components

- Prefer focused single-responsibility components over monoliths.
- Split large components by responsibility before adding more behavior.
- Keep tightly coupled one-off child render helpers in the parent file.
- Extract child components when reuse, size, testing, async loading, or ownership justifies the file boundary.
- Move complex JSX derivations into named helpers.
- Keep render components pure where practical; pass data, derived state, and handlers through props.
- Prefer existing local primitives and self-authored components before adding UI libraries.

## CSS Modules

- Use CSS modules for component-specific styles.
- Keep CSS modules scoped to the owning component and tightly coupled private children.
- Put shared layout, placement, and reusable primitives in the appropriate layout or component module.
- Name classes with the UpperCamelCase module filename first, then role segments in reading order.
- Keep class hierarchy shallow and semantic; avoid incidental tag, color, or implementation-detail names.
- Omit route/feature prefixes unless they disambiguate multiple owners in the same CSS module.

## CSS Structure

- Order properties by purpose: positioning/stacking, layout/display, box model/sizing, visual treatment, typography, interaction/state, then animation/transition.
- Do not reorder untouched CSS solely for churn.
- Place breakpoint/media-query blocks at the end of each CSS module.
- Order breakpoints by ascending width and keep related responsive overrides together.

## Breakpoints And Tokens

- Use established breakpoints: `480px`, `720px`, `900px`, `1200px`, `1600px`, and `2600px`.
- Keep `320px` reserved for the global typography ramp in `src/index.css`.
- Avoid off-scale breakpoints unless measured layout need requires one.
- Keep breakpoint values literal in `@media` conditions.
- Use CSS custom properties for shared or semantic values.
- Keep one-off component values local until reuse or semantic importance justifies a variable.
- Define shared CSS variables in `src/index.css`, with base tokens before semantic app tokens.

## Tooling And Accessibility

- Use `npm run lint:fix` for Oxlint auto-fixes, then review edits and rerun lint.
- Manually fix Oxlint violations that `--fix` cannot resolve.
- Prefer accessible controls with real buttons, labels, and keyboard behavior.
