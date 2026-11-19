// Generates tokens.css (web) and nativewind-preset.cjs (mobile, V2.1) from
// tokens.json, the single source of design tokens.
// Usage: node scripts/build.mjs [--check]  (--check fails if an output is stale)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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

// NativeWind preset: the same names as the web classes (bg-surface,
// text-heading, rounded-lg, shadow-card). Colors and shadows point at
// --evully-* variables; the app applies `themes.light` or `themes.dark` with
// NativeWind's vars() at its root, so both themes share one set of classes.
const themes = Object.fromEntries(
  ['light', 'dark'].map((mode) => [
    mode,
    Object.fromEntries(themed.map(([name, v]) => [name, v[mode]])),
  ]),
);
const preset = {
  theme: {
    extend: {
      colors: Object.fromEntries(colors.map(([name]) => [name, `var(--evully-${name})`])),
      borderRadius: tokens.radius,
      boxShadow: Object.fromEntries(
        shadows.map(([name]) => [name, `var(--evully-shadow-${name})`]),
      ),
      fontSize: Object.fromEntries(
        Object.entries(tokens.text).map(([name, t]) => [
          name,
          [t.size, { lineHeight: t.lineHeight, fontWeight: t.weight }],
        ]),
      ),
      fontFamily: { sans: tokens.font.sans.split(',').map((f) => f.trim().replaceAll("'", '')) },
    },
  },
};
const native = `/* Generated from tokens.json by scripts/build.mjs. Do not edit. */
/** NativeWind preset with the Evully tokens (DESIGN.md §3); \`themes\` feeds vars(). */
module.exports = ${JSON.stringify(preset, null, 2)};
module.exports.themes = ${JSON.stringify(themes, null, 2)};
`;

const outputs = [
  [join(dir, 'tokens.css'), css],
  [join(dir, 'nativewind-preset.cjs'), native],
];
if (process.argv.includes('--check')) {
  for (const [target, content] of outputs) {
    if (readFileSync(target, 'utf8') !== content) {
      console.error(`${target} is out of date: run npm run build -w @evully/tokens`);
      process.exit(1);
    }
  }
  // The preset must load and carry every token in both themes.
  const loaded = createRequire(import.meta.url)('../nativewind-preset.cjs');
  for (const [name] of themed) {
    if (!loaded.themes.light[name] || !loaded.themes.dark[name]) {
      console.error(`nativewind-preset.cjs: ${name} is missing a theme value`);
      process.exit(1);
    }
  }
} else {
  for (const [target, content] of outputs) writeFileSync(target, content);
}
