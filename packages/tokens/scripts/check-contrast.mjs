// Fails when a text/background pair in use is below WCAG 2.2 AA (DESIGN.md §6).
// Usage: node scripts/check-contrast.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const { color } = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'));

const TEXT = 4.5;
const UI = 3;
const surfaces = ['background', 'surface', 'surface-muted'];
const onSurfaces = ['text', 'text-muted', 'brand', 'positive', 'caution', 'neutral', 'danger'];

/** [foreground, background, minimum ratio]. */
const pairs = [
  ...onSurfaces.flatMap((fg) => surfaces.map((bg) => [fg, bg, TEXT])),
  ['brand-foreground', 'brand', TEXT],
  ['brand-soft-foreground', 'brand-soft', TEXT],
  ['text', 'brand-soft', TEXT],
  ['positive', 'positive-soft', TEXT],
  ['caution', 'caution-soft', TEXT],
  ['neutral', 'neutral-soft', TEXT],
  // Focus ring and selected outlines.
  ...surfaces.map((bg) => ['brand', bg, UI]),
];

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const failures = [];
for (const mode of ['light', 'dark']) {
  for (const [fg, bg, min] of pairs) {
    const ratio = contrast(color[fg][mode], color[bg][mode]);
    if (ratio < min) failures.push(`${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)} (needs ${min})`);
  }
}

if (failures.length > 0) {
  console.error(`Token contrast below WCAG AA:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Token contrast: ${pairs.length * 2} pairs pass WCAG AA.`);
