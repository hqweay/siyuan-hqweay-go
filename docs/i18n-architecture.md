# i18n Architecture

## Overview

This project uses a centralized, type-safe i18n system built on SiYuan's petal i18n JSON mechanism. All user-facing strings go through either `this.t(key)` (TypeScript) or `plugin.i18n[key]` (Svelte). Hardcoded Chinese characters in `.ts`/`.svelte` are forbidden.

There are three architectural layers:

1. **Source of truth** — `src/translations/parts/*.ts`
2. **Auto-generated aggregation** — `src/translations/{en,zh-CN}.ts` + `public/i18n/{en,zh-CN}.json`
3. **Runtime injection** — `plugin-registry.ts` injects `t()` into each sub-plugin

---

## 1. Translation Parts (source of truth)

Each sub-plugin has a file `src/translations/parts/lets-{name}.ts` exporting `en` and `zhCN` objects.

```
src/translations/parts/
├── lets-do-on-paste.ts
├── lets-dockPlus.ts
├── lets-dashboard.ts
├── settings.ts              # core settings keys
└── ...
```

### Key naming convention

All keys are prefixed by the **kebab-case folder name** of the plugin.

```ts
// src/translations/parts/lets-do-on-paste.ts
export const en = {
  "lets-do-on-paste.displayName": "Preprocess Data on Paste",
  "lets-do-on-paste.description": "Automatically preprocess and format data when pasting",
  "lets-do-on-paste.titleLink": "Auto Title Link",
} as const;

export const zhCN: typeof en = {
  "lets-do-on-paste.displayName": "粘贴时对数据预处理",
  "lets-do-on-paste.description": "在粘贴内容时自动进行数据预处理和格式化",
  "lets-do-on-paste.titleLink": "自动获取标题链接",
};
```

> **Why kebab-case prefix?** The folder name `lets-do-on-paste` is kebab, and the key must match so that `settings.svelte`'s group label resolution can find translations via `plugin.i18n[found.displayName]`.

### Core keys shared across plugins

Some keys are defined in `settings.ts` (the only part file without a `lets-*` prefix):

```ts
// src/translations/parts/settings.ts
"settings.mergeData": "Merge Data",
"settings.resetData": "Reset Data",
"settings.confirm": "Confirm",
```

---

## 2. Build Pipeline (auto-generation)

The `vite.config.ts` plugin `i18n-generate` runs at `buildStart`:

```
parts/*.ts  ──(generateTranslations)──>  en.ts, zh-CN.ts (aggregated)
                                              │
                                   (loadTsFile: esbuild in-memory)
                                              │
                                              v
                                     public/i18n/en.json
                                     public/i18n/zh-CN.json
                                              │
                                   (viteStaticCopy --> dist/i18n/)
                                              │
                                              v
                                   SiYuan loads petal i18n JSON
                                   --> plugin.i18n at runtime
```

### Step-by-step

1. **generateTranslations()** scans `src/translations/parts/*.ts`, generates `src/translations/{en,zh-CN}.ts` with spread imports of all parts.
2. **loadTsFile()** uses `esbuild` to transpile the generated TS in memory (without writing to disk) and load the compiled CJS module.
3. Exported objects are serialized to JSON and written to `public/i18n/`.
4. Vite's `viteStaticCopy` copies `public/i18n/` to `dist/i18n/` during build.
5. SiYuan reads `dist/i18n/{lang}.json` and sets `plugin.i18n` via its petal system.

### Core keys (hardcoded in vite.config.ts)

Common keys like `menuByURL`, `cancel`, `save` are currently hardcoded in `generateTranslations()` (lines 41-54 and 68-81 of `vite.config.ts`). These can be optionally extracted into `settings.ts` or a new `core.ts` part.

---

## 3. Runtime Injection

### PluginRegistry (`src/plugin-registry.ts`)

When scanning `src/lets-*/plugin.ts` metadata, PluginRegistry instantiates sub-plugin classes and injects helper methods:

```ts
// line 101
pluginInstance.t = (key: string) => this.mainPlugin?.i18n?.[key] ?? key;
pluginInstance.getSetting = (key: string) => settings.getBySpace(metadata.name, key);
pluginInstance.setSetting = (key: string, value: any) => {
  settings.setBySpace(metadata.name, key, value);
};
```

> **Critical:** SiYuan's `Plugin` class (at `app/src/plugin/index.ts`) defines only `i18n: IObject` — there is **no `t()` method**. Any code calling `this.mainPlugin?.t(key)` will crash at runtime with `_a2.t is not a function`.

### SubPluginBase (`src/libs/sub-plugin-base.ts`)

```ts
export class SubPluginBase implements SubPlugin {
  t!: (key: TranslationKey) => string;
  getSetting!: (key: string) => any;
  setSetting!: (key: string, value: any) => void;
}
```

> **Important:** `tsconfig.json` has `useDefineForClassFields: true`. With this setting, class fields declared with `!:` (definite assignment assertion) are initialized to `undefined` in the constructor, BEFORE PluginRegistry injects the real methods. The injection happens after construction via direct assignment (`pluginInstance.t = ...`).

### Usage in sub-plugins

```ts
// src/lets-xxx/index.ts
export default class MyPlugin extends SubPluginBase {
  onload() {
    console.log(this.t("lets-xxx.someKey"));  // typed via TranslationKey
  }
}
```

### Svelte access

```ts
// src/any-component.svelte
import { plugin } from "@/utils";

$: tTitle = plugin.i18n["lets-xxx.someKey"] || title;
```

The global `plugin` is a Proxy wrapping the `PluginLetsGo` instance (set via `setPlugin()` in `src/utils.ts`). `plugin.i18n` returns the original PluginLetsGo's `i18n` object directly.

---

## 4. Settings Panel Integration

### Dynamic group labels

In `src/setting.svelte`, the settings panel groups plugins by their `displayName`. The `getGroupLabel` function resolves these to human-readable strings:

```ts
const getGroupLabel = (groupName: string) => {
  const mainKey = `settings.${groupName}`;
  if (plugin.i18n[mainKey]) return plugin.i18n[mainKey];

  const found = pluginConfigs.find(p => p.displayName === groupName || p.name === groupName);
  if (found) {
    const key = `lets-${found.name}.displayName`;
    return plugin.i18n[key] || plugin.i18n[found.displayName] || found.displayName || found.name;
  }

  return groupName;
};
```

### Known pitfall

`found.name` is the internal camelCase name from `plugin.ts` metadata (e.g. `"doOnPaste"`), while the actual i18n key uses the kebab folder name (e.g. `"lets-do-on-paste.displayName"`). The construction `lets-${found.name}.displayName` produces `"lets-doOnPaste.displayName"` which does NOT exist in the translation file.

**Fallback chain order:** `plugin.i18n[lets-{name}.displayName]` → `plugin.i18n[found.displayName]` → `found.displayName` → `found.name` → raw key.

The second fallback `plugin.i18n[found.displayName]` is the key fix: `found.displayName` is already the full kebab key from `plugin.ts` (e.g. `"lets-do-on-paste.displayName"`) and directly matches the translation JSON key.

### Individual setting items

In `src/libs/setting-item.svelte`, each field's `title`, `description`, `placeholder`, and `buttonLabel` are resolved via:

```ts
$: tTitle = plugin.i18n[title] || title;
```

Since `title` is already the full i18n key (defined in each plugin's `plugin.settings` or constructed dynamically), this resolves correctly as long as the key exists in the translation JSON.

---

## 5. Adding a New Plugin with i18n

1. Create `src/lets-xxx/plugin.ts` with metadata:
   ```ts
   export default {
     name: "xxx",                     // internal camelCase name
     displayName: "lets-xxx.displayName",  // i18n key
     description: "lets-xxx.description",  // i18n key
   };
   ```

2. Create `src/lets-xxx/index.ts` extending `SubPluginBase`:
   ```ts
   export default class MyPlugin extends SubPluginBase {
     onload() {
       this.t("lets-xxx.someKey");  // type-safe via TranslationKey
     }
   }
   ```

3. Create `src/translations/parts/lets-xxx.ts`:
   ```ts
   export const en = {
     "lets-xxx.displayName": "...",
     "lets-xxx.description": "...",
     "lets-xxx.someKey": "...",
   } as const;
   export const zhCN: typeof en = { ... };
   ```

4. Restart the dev server (`pnpm dev`). Vite's `i18n-generate` plugin auto-rebuilds the aggregation and JSON files.

---

## 6. Troubleshooting

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `_a2.t is not a function` | Code calls `mainPlugin?.t(key)` but SiYuan Plugin has no `t()` | Use `mainPlugin?.i18n?.[key] ?? key` instead |
| Group label shows key string like `"lets-do-on-paste.displayName"` | `getGroupLabel` generates wrong key | `plugin.i18n[found.displayName]` fallback should resolve it; verify translation JSON contains the key |
| Individual setting shows key string | Key not found in `plugin.i18n` | Check `public/i18n/en.json` for the key; regenerate with `pnpm build` |
| Chinese characters visible in built source | Migration missed a string | `grep -rn '[^\x00-\x7F]' src/ --include="*.ts" --include="*.svelte"` (exclude backlink-panel) |
| `this.t` is undefined at runtime | SubPluginBase field initialized to `undefined` before injection | Don't call `this.t` in constructor; only after PluginRegistry injects it in `onload()` |
| Build error: `TranslationKey` type out of sync | Added keys to parts file but haven't rebuilt | Run `pnpm dev` or `pnpm build` to regenerate aggregated files |

---

## 7. Exceptions

### lets-syplugin-backlink-panel

This plugin maintains its own independent i18n system (84+ keys in `vendor/siyuan` style JSON files). It is excluded from the parts-based system and the grep verification command.
