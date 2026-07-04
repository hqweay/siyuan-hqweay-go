#!/usr/bin/env node
/**
 * 修复脚本：将误插入到多行 import { 中间的 getLogger import 移动到正确位置。
 * 
 * 问题表现：
 *   import {
 *   import { getLogger } from "@/libs/logger";  // ← 错误位置
 *   const log = getLogger("xxx");
 *     Foo,
 *   } from "yyy";
 *
 * 修复后：
 *   import {
 *     Foo,
 *   } from "yyy";
 *   import { getLogger } from "@/libs/logger";
 *   const log = getLogger("xxx");
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

function collectFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
      result.push(...collectFiles(full));
    } else if (/\.(ts|svelte)$/.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

// 检测文件中是否有"import {" 后紧跟 "import { getLogger }"（中间插入问题）
const BROKEN_PATTERN = /^(import\s*\{)\s*\n(import \{ getLogger \} from "@\/libs\/logger";\s*\n)(const log = getLogger\("[^"]*"\);\s*\n)/m;

let fixed = 0;

for (const filePath of collectFiles(SRC)) {
  if (filePath.endsWith("libs/logger.ts")) continue;
  
  let src = fs.readFileSync(filePath, "utf8");
  if (!BROKEN_PATTERN.test(src)) continue;

  // 提取 getLogger 行和 const log 行
  const match = src.match(BROKEN_PATTERN);
  if (!match) continue;

  const importGetLogger = match[2]; // "import { getLogger } from "@/libs/logger";\n"
  const constLog = match[3];         // "const log = getLogger(...);\n"

  // 找到对应多行 import 的关闭 "} from '...'"
  // 策略：移除 getLogger/const log 两行，然后在整个 import 块结束后插入
  let cleaned = src.replace(BROKEN_PATTERN, (_, openBrace) => openBrace + "\n");

  // 现在找到第一个 "} from " 行（多行 import 结束），在其后插入
  const closingMatch = cleaned.match(/^(\} from ['"][^'"]+['"];)\s*$/m);
  if (!closingMatch) {
    console.warn(`[WARN] Cannot find closing import brace in ${filePath.replace(ROOT+"/","")}, skipping`);
    continue;
  }

  cleaned = cleaned.replace(
    /(\} from ['"][^'"]+['"];)/m,
    `$1\n${importGetLogger.trim()}\n${constLog.trim()}`
  );

  fs.writeFileSync(filePath, cleaned, "utf8");
  console.log(`[fixed] ${filePath.replace(ROOT + "/", "")}`);
  fixed++;
}

console.log(`\nDone. ${fixed} files fixed.`);
