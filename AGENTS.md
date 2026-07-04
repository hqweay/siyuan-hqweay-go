# Architecture

PluginLetsGo scans `src/lets-*/plugin.ts` -> PluginRegistry auto-instantiates SubPluginBase sub-plugins.

# Sub-Plugin Rules

- Must extend `SubPluginBase`; never manually instantiate settings or register event listeners that leak memory. `onload()`/`onunload()` stubs are provided.
- Must be registered via `PluginRegistry` to receive injected helpers (`this.t`, `this.getSetting`, `this.setSetting`). Never call helpers outside registry context.

# i18n

- **TS**: `this.t("lets-xxx.someKey")` (type-safe via `TranslationKey` union from `src/types/plugin.d.ts`)
- **Svelte**: `plugin.i18n["lets-xxx.someKey"]` (global proxy from `@/utils`)
- **Define**: `src/translations/parts/lets-{name}.ts` — export `en` and `zhCN: typeof en` (key symmetry enforced at compile time)
- **Generation**: Vite `i18n-generate` plugin aggregates `parts/*.ts` -> `src/translations/{en,zh-CN}.ts` -> `public/i18n/{en,zh-CN}.json`. **Do not manually edit** generated files.
- **Git**: Generated files (`src/translations/{en,zh-CN}.ts`, `public/i18n/*.json`) are blacklisted in `.gitignore`. Don't track them.
- **Settings metadata**: Use translation keys (e.g. `"lets-xxx.someKey"`) for option `title`, `description`, `value` in `plugin.ts`. Resolved at render time by `setting-item.svelte` via `plugin.i18n[key]`.
- **Settings group keys**: Raw object keys (e.g. `"开关"`, `"设置"`) and `displayName` are resolved visually by `getGroupLabel` in `setting.svelte`. Comparisons use the raw key, not the translated display text.

# CRITICAL GOTCHAS

1. SiYuan `Plugin` class has `i18n` property but **NO `t()` method**. Injection in `plugin-registry.ts:101` uses `this.mainPlugin?.i18n?.[key] ?? key`; calling `this.mainPlugin?.t(key)` crashes with `_a2.t is not a function`.
2. `tsconfig` has `useDefineForClassFields: true`. SubPluginBase fields like `t!: ...` are `undefined` during constructor. Injection is done after instantiation in PluginRegistry.
# Known Issues

- `src/lets-block-attr/plugin.ts` customProperties default has Chinese labels (`"创建时间"`, `"更新时间"`). These are CSS content strings in user-configurable textarea — i18n-izing them requires resolving keys at CSS generation time in `ShowCustomPropertiesUnderTitle.ts`, which is a larger refactor beyond simple key substitution.

# Release

- Bump versions using Changesets: `npx changeset` / `npx changeset version`
- Run `pnpm release` (wraps `update-version.sh`) for interactive bumps and release commits
- `update-changelog-data.cjs` extracts changes for GitHub Release Action

# Verification

```sh
grep -rn '[^\x00-\x7F]' src/lets-xxx/ --include="*.ts" --include="*.tsx" --include="*.svelte"
```
Zero matches before finalising any sub-plugin (excluding the parts file itself).

# Adding a new plugin

1. Create `src/lets-xxx/plugin.ts` (metadata: `name`, `displayName`, `description` as i18n keys) and `index.ts` (class extends SubPluginBase)
2. Create `src/translations/parts/lets-xxx.ts` exporting `en` + `zhCN: typeof en` with keys like `"lets-xxx.someKey"`
3. In `index.ts`: `this.t("lets-xxx.someKey")`; in Svelte: `plugin.i18n["lets-xxx.someKey"]`
4. Restart dev server (vite auto-generates aggregated TS + JSON)
5. Verify: `grep -rn '[^\x00-\x7F]' src/lets-xxx/` returns zero
