#!/usr/bin/env node
/**
 * check-docs-links — 文档引用可达性检查（防文档腐烂的机械兜底）。
 *
 * 用法：
 *   node scripts/check-docs-links.js [仓库根目录]   # 缺省向上查找 .git 定位仓库根
 *   npm run check:docs                             # 建议接线进 test:verify 提交门禁
 *
 * 规则：扫描全仓 markdown 与代码 js 中的文档引用，引用目标必须真实存在；
 * 不存在即逐条列出 文件:行号 并以退出码 1 失败。
 * 只校验文件存在性，不校验行号锚点（行号漂移频繁，不做硬门禁）。
 *
 * 豁免：仓库根放 `.check-docs-ignore`（每行一个字面引用，# 起始为注释），
 * 用于文档中引用「示例路径 / 规划中但尚未创建的文件」的场景。慎用——
 * 豁免一条引用等于人为制造一个死链，只应放过确有理由的示例引用。
 *
 * 改自 keshiqing-miniapp 仓库（2026-10-17 文档重组时引入）。
 */
const fs = require('fs');
const path = require('path');

// —— 可按目标项目调整的配置 ——
// 仓库根级、常被引用的活文档（与 docs/** 一样做可达性校验）
const ROOT_FILES = ['RELEASE_CHECKLIST.md'];
// 需要扫描 js 注释/字符串引用的目录（不存在会跳过）
const SCAN_JS_DIRS = ['shared', 'scripts', 'cloudfunctions', 'miniprogram', 'e2e', 'integration', 'test-support'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.local',
  'generated-images',
  'miniprogram_npm',
  'visual-baseline',
  'visual-actual',
  'visual-diff',
]);

function detectRoot() {
  const arg = process.argv[2];
  if (arg) return path.resolve(arg);
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

function walk(dir, predicate, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, predicate, out);
    } else if (predicate(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const ROOT = detectRoot();

  // 仓库级豁免：.check-docs-ignore 中列出的字面引用不参与可达性校验
  const ignoredRefs = new Set();
  const ignoreFile = path.join(ROOT, '.check-docs-ignore');
  if (fs.existsSync(ignoreFile)) {
    for (const line of fs.readFileSync(ignoreFile, 'utf8').split('\n')) {
      const t = line.trim();
      if (t && !t.startsWith('#')) ignoredRefs.add(t);
    }
  }

  // 引用形态：docs/xxx.md、docs/<子目录>/xxx.md、ROOT_FILES；允许可选 ../ 前缀与 :行号 锚点
  const rootAlt = ROOT_FILES.map(escapeRegExp).join('|');
  const REF_RE = new RegExp(
    `(?:\\.\\.\\/)*(?:docs\\/[\\w./-]+\\.md|${rootAlt})(?::\\d+(?:-\\d+)?)?`,
    'g'
  );

  const files = [
    ...walk(ROOT, (name) => name.endsWith('.md')),
    ...walk(path.join(ROOT, 'docs'), (name) => name.endsWith('.md')),
  ];
  for (const dir of SCAN_JS_DIRS) {
    files.push(...walk(path.join(ROOT, dir), (name) => name.endsWith('.js')));
  }

  const broken = [];
  let checked = 0;
  let ignored = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((text, i) => {
      const matches = text.match(REF_RE);
      if (!matches) return;
      for (const raw of matches) {
        const ref = raw
          .replace(/^(?:\.\.\/)+/, '')
          .replace(/:\d+(?:-\d+)?$/, '');
        if (ignoredRefs.has(ref)) {
          ignored += 1;
          continue;
        }
        checked += 1;
        if (!fs.existsSync(path.join(ROOT, ref))) {
          broken.push(`${rel}:${i + 1} -> ${ref}`);
        }
      }
    });
  }

  if (broken.length > 0) {
    console.error(`[check-docs-links] FAIL: ${broken.length}/${checked} 处文档引用不可达`);
    for (const b of broken) console.error(`  ${b}`);
    console.error('[check-docs-links] 删除/移动文档时必须同步更新引用（含代码注释）。');
    process.exit(1);
  }

  const ignoreNote = ignored > 0 ? `（${ignored} 处按 .check-docs-ignore 豁免）` : '';
  console.log(`[check-docs-links] OK: ${files.length} 个文件中 ${checked} 处文档引用全部可达${ignoreNote}`);
}

main();
