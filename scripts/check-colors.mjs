// Colors in the UI come only from the design tokens (DESIGN.md §3.1): no hex,
// rgb()/hsl(), Tailwind palette classes (`text-red-500`, `bg-black/40`) or
// arbitrary colors (`bg-[#…]`) in screens and components. Prints problems only.
// Usage: node scripts/check-colors.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const folders = ['packages/ui/src', 'packages/app-web/src', 'apps/desktop/src/renderer'];

// `neutral` is an Evully token (`bg-neutral`), so only its numbered shades count.
const palette =
  'black|white|slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const utilities =
  'bg|text|border|fill|stroke|ring|outline|from|via|to|shadow|decoration|accent|caret|divide|placeholder';
const rules = [
  [/#[0-9a-fA-F]{3,8}\b/, 'hex color'],
  [/\b(?:rgba?|hsla?|oklch)\(/, 'color function'],
  [new RegExp(`\\b(?:${utilities})-(?:${palette})(?:-\\d{2,3})?(?:/\\d+)?\\b`), 'palette class'],
  [new RegExp(`\\b(?:${utilities})-neutral-\\d{2,3}\\b`), 'palette class'],
  [/\b(?:bg|text|border|fill|stroke)-\[(?:#|rgb|hsl)/, 'arbitrary color'],
];

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx?|css)$/.test(name)) yield path;
  }
}

const problems = [];
for (const folder of folders) {
  for (const file of files(join(root, folder))) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const [pattern, kind] of rules) {
          const match = line.match(pattern);
          if (match) problems.push(`${relative(root, file)}:${i + 1} ${kind}: ${match[0]}`);
        }
      });
  }
}

if (problems.length > 0) {
  console.error(`Colors outside the design tokens (DESIGN.md §3.1):\n${problems.join('\n')}`);
  process.exit(1);
}
