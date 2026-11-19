// Icons go through `Icon` from @evully/ui (DESIGN.md §4.2): three sizes and a
// 2 px stroke. Fails when a Lucide icon is rendered directly as JSX
// (`<Pencil className="size-4" />`) instead of `<Icon icon={Pencil} />`.
// Prints problems only. Usage: node scripts/check-icons.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const folders = ['packages/ui/src', 'packages/app-web/src', 'apps/desktop/src/renderer'];
const allowed = new Set(['packages/ui/src/components/icon.tsx']);

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (name.endsWith('.tsx')) yield path;
  }
}

/** Each `<Name` of a Lucide import, which should be `icon={Name}` instead. */
function directUses(source, names, where) {
  return names.flatMap((name) =>
    [...source.matchAll(new RegExp(`<${name}\\b`, 'g'))].map((match) => {
      const line = source.slice(0, match.index).split('\n').length;
      return `${where}:${line} <${name}> without Icon`;
    }),
  );
}

const problems = [];
for (const folder of folders) {
  for (const file of files(join(root, folder))) {
    const where = relative(root, file).replaceAll('\\', '/');
    if (allowed.has(where)) continue;
    const source = readFileSync(file, 'utf8');
    const lucide = source.match(/import \{([^}]*)\} from ['"]lucide-react['"]/);
    if (!lucide) continue;
    const names = lucide[1]
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n && !n.startsWith('type '))
      .map((n) => n.split(' as ').at(-1));
    problems.push(...directUses(source, names, where));
  }
}

if (problems.length > 0) {
  console.error(`Icons outside Icon (DESIGN.md §4.2):\n${problems.join('\n')}`);
  process.exit(1);
}
