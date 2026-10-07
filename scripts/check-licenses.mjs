// Fails if any installed dependency (runtime, bundled or tooling) uses a strong copyleft license, which is
// incompatible with Evully's proprietary license (ARCHITECTURE.md §8).
// Usage: node scripts/check-licenses.mjs
import { execSync } from 'node:child_process';

const BLOCKED = /\b(A?GPL|LGPL|SSPL|EUPL|OSL)\b/i;

const packages = JSON.parse(
  execSync('npm query "*"', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
);
const external = packages.filter((p) => !p.name?.startsWith('@evully/') && p.name !== 'evully');

const licenseOf = (p) =>
  typeof p.license === 'string' ? p.license : (p.license?.type ?? 'UNKNOWN');

const blocked = external.filter((p) => BLOCKED.test(licenseOf(p)));
const unknown = external.filter((p) => licenseOf(p) === 'UNKNOWN');

for (const p of unknown) console.warn(`warn: no license declared: ${p.name}@${p.version}`);
if (blocked.length) {
  for (const p of blocked) console.error(`blocked: ${p.name}@${p.version} (${licenseOf(p)})`);
  process.exit(1);
}
console.log(`ok: ${external.length} packages checked, no copyleft licenses`);
