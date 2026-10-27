// Publishes the built installer as an update (README §33, SECURITY.md §2.8).
//
//   npm run dist
//   npm run release:publish -- --notes-file <notes.md>
//
// Signs the installer, writes its SHA-256 and creates the GitHub release in the
// public releases-only repository, with what electron-updater needs: the
// installer, its blockmap, latest.yml and the Ed25519 signature.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { keyFile, signUpdate } from './update-signing.mjs';

const RELEASES_REPO = 'lbcamargo94/evully-releases';
const desktop = join(import.meta.dirname, '..', 'apps', 'desktop');
const { version } = JSON.parse(readFileSync(join(desktop, 'package.json'), 'utf8'));
const release = join(desktop, 'release');

const notesIndex = process.argv.indexOf('--notes-file');
const notesFile = notesIndex > 0 ? process.argv[notesIndex + 1] : undefined;
if (!notesFile || !existsSync(notesFile)) {
  console.error('Usage: npm run release:publish -- --notes-file <notes.md>');
  process.exit(1);
}

const installer = join(release, `Evully-Setup-${version}.exe`);
const assets = [installer, `${installer}.blockmap`, join(release, 'latest.yml')];
for (const file of assets) {
  if (!existsSync(file)) {
    console.error(`Missing ${basename(file)}; run npm run dist first.`);
    process.exit(1);
  }
}
const latest = readFileSync(join(release, 'latest.yml'), 'utf8');
if (!latest.includes(`version: ${version}\n`)) {
  console.error(`latest.yml is not for ${version}; run npm run dist again.`);
  process.exit(1);
}

const signature = await signUpdate(installer, version, readFileSync(keyFile(), 'utf8'));
writeFileSync(`${installer}.sig`, `${signature}\n`);
const sha256 = createHash('sha256').update(readFileSync(installer)).digest('hex');
writeFileSync(`${installer}.sha256`, `${sha256} *${basename(installer)}\n`);

const prerelease = version.includes('-');
execFileSync(
  'gh',
  [
    'release',
    'create',
    `v${version}`,
    '--repo',
    RELEASES_REPO,
    '--title',
    `Evully ${version}`,
    '--notes-file',
    notesFile,
    prerelease ? '--prerelease' : '--latest',
    ...assets,
    `${installer}.sig`,
    `${installer}.sha256`,
  ],
  { stdio: 'inherit' },
);
console.log(`Published ${version} to ${RELEASES_REPO} (SHA-256 ${sha256}).`);
