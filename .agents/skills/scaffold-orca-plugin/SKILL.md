---
name: scaffold-orca-plugin
description: >
  Scaffold a new Orca Note sub-plugin correctly on the first attempt.
  Use when the user wants to add a new lets-* sub-plugin, build a new panel/view,
  or register a new command that integrates with the Orca Note plugin architecture.
---

# Scaffold Orca Plugin

A proven workflow for building a new Orca Note sub-plugin that compiles and runs
on the first attempt. Skipping any step typically leads to multi-round debugging.

## Step 1: Pre-flight Research (Do Not Skip)

Before writing a single line of code:

1. **Read the project rule**:
   `.agent/rules/orca-note-rule.md` — contains hard constraints (CSS variables, i18n,
   peerDependencies, BasePlugin inheritance, etc.)

2. **Identify the API surface**: For any Orca backend call you plan to make, look it up in
   `src/orca.d.ts` first — specifically `Block`, `QueryDescription2`, `APIMsg`, and
   relevant `Query*` types. Never guess parameters.

3. **Reference an existing plugin** that does something similar:
   - Panel registration → `src/lets-local-graph/index.tsx`
   - `get-blocks-with-tags` → `src/lets-pinned-blocks/index.tsx`
   - `query` API → `src/lets-srs/core/query.ts`
   - Cross-plugin soft dependency → `src/lets-dashboard/utils/dataFetcher.ts`

## Step 2: Architectural Decisions (Lock These In)

Answer these before coding:

| Question | Correct answer for this project |
|---|---|
| How does a full-page panel open? | `registerPanel("id", Component)` + `nav.goTo("id", {}, activePanelId)` |
| How does a sidebar panel open? | `registerPanel("id", Component)` + `nav.addTo(panelId, "right", { view: "id", ... })` |
| How does translation work? | `plugin.t("key")` inside components (pass `plugin` as prop). Never use global `t()` in sub-plugin UI. |
| Where do translations live? | `src/translations/parts/[plugin-name].ts` — auto-scanned, no manual registration. Keys must be prefixed: `"plugin-name.key"` |
| Can I use hardcoded colors? | No. Always use CSS variables: `var(--b3-theme-primary)`, `var(--b3-theme-background)`, etc. |
| Can I use hardcoded Chinese in JSX? | No. Every user-visible string must go through `plugin.t()`. |
| How do I access `plugin.name` externally? | `name` is `protected`. Use the public `get name()` getter added to `BasePlugin`. |
| Cross-plugin soft dependency? | `await import("../../lets-other/core/export")` in `try/catch`. Return `null` on failure. |

## Step 3: Build Order (Bottom-Up)

Write files in this order to avoid forward references:

1. `utils/cache.ts` — pure utilities, no project imports
2. `utils/dateUtils.ts` — pure utilities
3. `utils/dataFetcher.ts` — calls Orca backend APIs
4. Leaf components (no sub-components): e.g., `*Card.tsx`, `StatsSummary.tsx`
5. Container components: e.g., `OnThisDay.tsx`, `DashboardView.tsx`
6. `index.tsx` — plugin entry: `registerPanel`, `registerCommand`, `headbarButtonId`
7. `src/translations/parts/[name].ts` — all i18n keys, written alongside step 6

## Step 4: i18n Checklist

Every user-visible string must have a translation key. Before finalizing:

```bash
# Grep for Chinese characters in TS/TSX files (should return zero results)
grep -rn '[^\x00-\x7F]' src/lets-[yourplugin]/ --include="*.tsx" --include="*.ts"
```

Expected: zero matches in any `.tsx` or `.ts` file (only translation files are exempt).

## Step 5: Verification

```bash
pnpm build
```

A clean build with no TypeScript errors means the plugin is ready to load in Orca.
Source-map warnings from other modules are pre-existing noise — ignore them.
