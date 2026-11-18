// Generates tokens.css from tokens.json (the single source of design tokens).
// Usage: node scripts/build.mjs [--check]  (--check fails if tokens.css is stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'));
const colors = Object.entries(tokens.color);
const shadows = Object.entries(tokens.shadow);

// Values that change with the theme: colors, and shadows (DESIGN.md §3.3:
// the dark theme elevates with a lighter surface instead of a shadow).
const themed = [
  ...colors.map(([name, v]) => [`--evully-${name}`, v]),
  ...shadows.map(([name, v]) => [`--evully-shadow-${name}`, v]),
];
const vars = (mode) => themed.map(([name, v]) => `  ${name}: ${v[mode]};`).join('\n');
const darkVars = vars('dark').replaceAll('\n', '\n  ');

// The regular weight (400) is left out so a text class never undoes the
// weight an element inherits or sets (a <strong> in caption size stays bold).
const text = Object.entries(tokens.text).flatMap(([name, t]) => [
  `  --text-${name}: ${t.size};`,
  `  --text-${name}--line-height: ${t.lineHeight};`,
  ...(t.weight === '400' ? [] : [`  --text-${name}--font-weight: ${t.weight};`]),
]);

const css = `/* Generated from tokens.json by scripts/build.mjs. Do not edit. */
:root {
  color-scheme: light;
${vars('light')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
  ${darkVars}
  }
}

:root[data-theme='dark'] {
  color-scheme: dark;
${vars('dark')}
}

@theme inline {
${colors.map(([name]) => `  --color-${name}: var(--evully-${name});`).join('\n')}
${Object.entries(tokens.radius)
  .map(([name, value]) => `  --radius-${name}: ${value};`)
  .join('\n')}
${Object.entries(tokens.layout)
  .map(([name, value]) => `  --container-${name}: ${value};`)
  .join('\n')}
${shadows.map(([name]) => `  --shadow-${name}: var(--evully-shadow-${name});`).join('\n')}
${text.join('\n')}
  --font-sans: ${tokens.font.sans};
}
`;

const target = join(dir, 'tokens.css');
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== css) {
    console.error('tokens.css is out of date: run npm run build -w @evully/tokens');
    process.exit(1);
  }
} else {
  writeFileSync(target, css);
}
