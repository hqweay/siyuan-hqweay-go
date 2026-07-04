#!/usr/bin/env node
/**
 * 批量将 console.xxx 替换为 log.xxx，并在文件顶部注入 getLogger 导入。
 *
 * 支持 .ts 和 .svelte 文件。
 * - .ts:     在文件第一行之后插入 import
 * - .svelte: 在 <script ...> 行之后插入 import
 *
 * 跳过已含 getLogger 的文件。
 * 跳过 src/libs/logger.ts 自身。
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

// 从文件路径推断模块名，取最近的 lets-xxx 目录名，否则取文件名（不带后缀）
function inferName(filePath) {
  const parts = filePath.replace(SRC + "/", "").split("/");
  const letsDir = parts.find((p) => p.startsWith("lets-"));
  if (letsDir) return letsDir;
  return parts[parts.length - 1].replace(/\.(ts|svelte)$/, "");
}

// 递归收集 .ts 和 .svelte 文件
function collectFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 node_modules / dist / 生成文件目录
      if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
      result.push(...collectFiles(full));
    } else if (/\.(ts|svelte)$/.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

const files = collectFiles(SRC);

let changed = 0;
let skipped = 0;

for (const filePath of files) {
  // 跳过 logger 自身
  if (filePath.endsWith("libs/logger.ts")) { skipped++; continue; }
  // 跳过生成文件目录下的聚合文件
  if (/src\/translations\/(en|zh-CN)\.ts$/.test(filePath)) { skipped++; continue; }

  let src = fs.readFileSync(filePath, "utf8");

  // 跳过已经引入过 getLogger 的文件
  if (src.includes("getLogger")) { skipped++; continue; }

  // 检测是否含有 console.log / debug / warn / error
  if (!/console\.(log|debug|warn|error)\s*\(/.test(src)) { skipped++; continue; }

  const name = inferName(filePath);
  const importLine = `import { getLogger } from "@/libs/logger";\nconst log = getLogger("${name}");`;

  let out;
  if (filePath.endsWith(".svelte")) {
    // 插入到 <script ...> 行之后
    out = src.replace(
      /^(\s*<script[^>]*>)/m,
      `$1\n${importLine}`
    );
  } else {
    // .ts: 插入到第一行之后（保留 shebang / 第一行 import）
    // 实际上插入到文件开头更安全，在现有 import 块末尾插入更好
    // 简单做法：在第一行之后插入
    const lines = src.split("\n");
    // 找到最后一个连续 import 行的位置
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^import\s/.test(lines[i])) lastImportIdx = i;
      else if (lastImportIdx >= 0 && lines[i].trim() === "") continue;
      else if (lastImportIdx >= 0) break;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }
    out = lines.join("\n");
  }

  // 替换 console.xxx
  out = out
    .replace(/console\.log\s*\(/g, "log.info(")
    .replace(/console\.debug\s*\(/g, "log.debug(")
    .replace(/console\.warn\s*\(/g, "log.warn(")
    .replace(/console\.error\s*\(/g, "log.error(");

  fs.writeFileSync(filePath, out, "utf8");
  console.log(`[changed] ${filePath.replace(ROOT + "/", "")}`);
  changed++;
}

console.log(`\nDone. ${changed} files changed, ${skipped} skipped.`);
