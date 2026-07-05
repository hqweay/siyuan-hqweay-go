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

# Logger System

- `src/libs/logger.ts` — `getLogger("my-name")` returns `{ debug, info, warn, error }` with `[my-name]` prefix.
- Default OFF. Toggled globally via settings checkbox `"settings.debugLogging"` → calls `enableLogging(bool)`.
- All `console.*` calls replaced across all plugins (500+ replacements). The only exception: `.catch(console.error)` callback refs.
- Usage: `import { getLogger } from "@/libs/logger"; const log = getLogger("lets-xxx");` at module top.

# Full-Doc Commands (API-based, bypasses frontend lazy-load)

When implementing a command that needs to process ALL blocks in a document (not just lazily-rendered DOM):

1. Query block IDs via SQL: `SELECT id FROM blocks WHERE root_id = '${docId}' AND type IN (...)` (see `commands.ts:getDocBlockIds`).
2. For each block: `POST /api/block/getBlockDOM` → parse DOM → transform in-place → `updateBlock("dom", outerHTML, id)`.
3. Use `callback` (not `editorCallback`) for `plugin.addCommand()` so it works from both the command palette and bound hotkeys.
4. Reference: `src/lets-href-to-ref/commands.ts`.

# Adding Plugin Commands

- Use `plugin.addCommand({ langKey, hotkey, callback })` in the plugin's `onload()`.
- `langKey` must have a matching translation entry (e.g. `"lets-xxx.cmdMyAction"`).
- For editor-scoped commands: `editorCallback` receives the active protyle automatically; `callback` does not.
- For full-doc operations: prefer `callback` + the SQL+getBlockDOM pattern above.

# CRITICAL GOTCHAS

1. SiYuan `Plugin` class has `i18n` property but **NO `t()` method**. Injection in `plugin-registry.ts:101` uses `this.mainPlugin?.i18n?.[key] ?? key`; calling `this.mainPlugin?.t(key)` crashes with `_a2.t is not a function`.
2. `tsconfig` has `useDefineForClassFields: true`. SubPluginBase fields like `t!: ...` are `undefined` during constructor. Injection is done after instantiation in PluginRegistry.
3. Settings `getBySpace(space, key)` — `space` must match the plugin's `name` field (e.g. `"convert"`), NOT the folder name or `displayName`.

# Known Issues

- `src/lets-block-attr/plugin.ts` customProperties default has Chinese labels (`"创建时间"`, `"更新时间"`). These are CSS content strings in user-configurable textarea — i18n-izing them requires resolving keys at CSS generation time in `ShowCustomPropertiesUnderTitle.ts`, which is a larger refactor beyond simple key substitution.

# Release

- Bump versions using Changesets: `npx changeset` / `npx changeset version`
- Run `pnpm release` (wraps `update-version.sh`) for interactive bumps and release commits
- `update-changelog-data.cjs` extracts changes for GitHub Release Action

# Writing Changesets

When creating a `.changeset/*.md` file:

- Write **user-facing**, not technical. Describe what the user gains, not how it's implemented.
  - ✅ "行内元素转换：支持 10 种行内元素一键转为纯文本，可在命令面板或快捷键设置中全文批量处理。"
  - ❌ "重构为 converters + commands + index 三层架构；通过 SQL + getBlockDOM 实现全文处理。"
- Keep each bullet point concise (1-2 lines max).
- Group related changes into one bullet.
- Example format:
  ```md
  ---
  "siyuan-hqweay-go": minor
  ---

  - 行内元素转换：现在支持……，并可在命令面板或快捷键设置中全文批量处理。
  - 新增调试日志开关（默认关闭），可在设置中开启以查看运行日志，便于排查问题。
  - 修复部分插件界面残留英文或未翻译文本的问题。
  ```

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

# Reference Codebases

本项目基于思源笔记插件体系，以下本地路径是开发的主要参考来源。

## 快查表（优先查这里，禁止凭记忆假设 API 行为）

| 需求 | 查哪里 |
|------|--------|
| REST API 参数 / 返回值 | `vendor/siyuan/docs/API.zh-CN.md` |
| 块/行内元素数据格式（`.sy` 文件结构） | `vendor/siyuan/docs/SY-FORMAT.zh-CN.md` |
| 工作区目录结构 | `vendor/siyuan/docs/WORKSPACE.zh-CN.md` |
| 插件 API 用法（addCommand / addDock / addTab…） | `vendor/plugin-sample/src/index.ts` |
| 项目已封装的 API 函数 | `src/api.ts`（优先！不要直接看 node_modules） |
| 思源前端/内核具体实现细节 | `vendor/siyuan/app/` 或 `vendor/siyuan/kernel/` |

## 路径说明

- `vendor/siyuan/docs/` — 官方文档，含完整的 REST API 列表、SY-FORMAT 块格式规范、工作区布局说明。**遇到 API 行为或参数格式有疑问时必查，禁止猜测。**
- `vendor/siyuan/` — 完整源码（Go 内核 + 前端 TS/Svelte）。**只读参考，禁止修改。** 适用于需要验证内部行为时深入查阅。
- `vendor/plugin-sample/` — 官方插件模板，展示 `Plugin` 类生命周期及标准 API 的惯用法。
- `src/api.ts` — 项目对 kernel REST API 的封装层。**优先使用已有函数；需要新接口时在此处添加再引用。**

## 关键约束

- `IOperation`、`IProtyle` 等核心类型从 `"siyuan"` 包直接 import，而非从 `@siyuan-community/siyuan-sdk`。
- `fetchSyncPost` 来自 `"siyuan"` 包，用于调用 `src/api.ts` 中尚未封装的 kernel API。
- `plugin.addCommand` 的 `callback` / `globalCallback` 出现在命令面板；`editorCallback` **仅响应快捷键触发，不出现在命令面板**。
- 全文处理块内容时，使用 SQL 查 block ID + `/api/block/getBlockDOM` 获取真实 DOM，不依赖前端懒加载的 wysiwyg 元素。
