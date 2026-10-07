// Verifica a consistência da documentação: referências "§x.y" e links
// relativos entre os arquivos .md da raiz. Imprime apenas problemas.
// Uso: node scripts/check-docs.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = readdirSync(root).filter((f) => f.endsWith('.md'));
const text = Object.fromEntries(docs.map((f) => [f, readFileSync(join(root, f), 'utf8')]));
const sections = Object.fromEntries(
  docs.map((f) => [f, new Set([...text[f].matchAll(/^#+ (\d+(?:\.\d+)*)[ .]/gm)].map((m) => m[1]))]),
);

const problems = [];

for (const file of docs) {
  text[file].split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;

    for (const [, target] of line.matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
      if (!existsSync(join(root, target))) problems.push(`${where} link para arquivo inexistente: ${target}`);
    }

    // Uma referência pertence ao documento citado mais recentemente na mesma
    // linha (link .md ou "README"); sem citação, ao próprio arquivo ou ao README.
    const tokens = [...line.matchAll(/\[[^\]]*\]\(([A-Z]+\.md)[^)]*\)|\b(README)\b|§(\d+(?:\.\d+)*)/g)];
    let context = null;
    for (const [, linked, readme, ref] of tokens) {
      if (linked) context = linked;
      else if (readme) context = 'README.md';
      else {
        const candidates = context ? [context] : [file, 'README.md'];
        if (!candidates.some((doc) => sections[doc]?.has(ref))) {
          problems.push(`${where} §${ref} não encontrada em ${candidates.join(' ou ')}`);
        }
      }
    }
  });
}

if (problems.length) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log(`ok: ${docs.length} documentos verificados`);
