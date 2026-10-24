#!/usr/bin/env node
/**
 * Fails if an emoji or decorative symbol glyph appears anywhere in the shipped apps.
 *
 * Emoji are not part of the SMOMO brand and are banned outright. They also render
 * differently on every platform, cannot be recoloured, and ignore font sizing — which is
 * why a literal star, tick or cross is a bug even though it looks harmless in an editor.
 * Use a vector icon instead: `StarIcon` / `CheckIcon` / `CloseIcon` / `DownloadIcon` from
 * `apps/web/src/components/ui.tsx` on web, `Ionicons` from `@/ui` on mobile, and
 * `<CategoryIcon>` for service categories.
 *
 * Run with `pnpm lint:emoji`. Covers apps/* and packages/*; docs and the handoff
 * reference copies are excluded because they describe history rather than ship.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RANGES = [
  [0x1f000, 0x1faff], // pictographs, emoticons, transport, supplemental
  [0x1f1e6, 0x1f1ff], // regional indicators (flags)
  [0x2600, 0x26ff],   // misc symbols — includes the bare star
  [0x2700, 0x27bf],   // dingbats — includes the bare tick and cross
  [0xfe0f, 0xfe0f],   // variation selector-16 (emoji presentation)
  [0x2b00, 0x2bff],   // arrows and stars
  [0x1f004, 0x1f0cf],
  [0x3030, 0x303d],
  [0x203c, 0x2049],
];
const isEmoji = (cp) => RANGES.some(([a, b]) => cp >= a && cp <= b);

const ROOTS = ['apps/web', 'apps/mobile', 'apps/api', 'packages'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html', '.sql']);
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', '.turbo', '.expo', 'android', 'build', '.vercel']);

const findings = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (EXTS.has(extname(name))) {
      const lines = readFileSync(path, 'utf8').split('\n');
      lines.forEach((line, i) => {
        const bad = [...new Set([...line].filter((c) => isEmoji(c.codePointAt(0))))];
        if (bad.length) findings.push({ path, line: i + 1, chars: bad.join(''), text: line.trim().slice(0, 100) });
      });
    }
  }
}

for (const root of ROOTS) {
  try {
    walk(root);
  } catch {
    // A root that isn't present in this checkout is not a failure.
  }
}

if (findings.length === 0) {
  console.log('No emoji or symbol glyphs found in apps/* or packages/*.');
  process.exit(0);
}

console.error(`\nEmoji or symbol glyphs found in ${findings.length} place(s). Use a vector icon.\n`);
for (const f of findings) {
  console.error(`  ${f.path}:${f.line}  [${f.chars}]`);
  console.error(`      ${f.text}`);
}
console.error('\nSee the header of scripts/check-no-emoji.mjs for the icons to use instead.\n');
process.exit(1);
