// Ed25519 signatures for automatic updates (SECURITY.md §2.8).
//
//   node scripts/update-signing.mjs keygen             creates the key pair (once)
//   node scripts/update-signing.mjs sign <file> <ver>  writes <file>.sig
//
// The private key lives only on the publisher's computer, outside the repo
// (%USERPROFILE%\.evully\update-signing-key.pem, or EVULLY_UPDATE_KEY). The
// public key is embedded in apps/desktop/src/main/update-public-key.ts.
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const keyFile = () =>
  process.env.EVULLY_UPDATE_KEY ?? join(homedir(), '.evully', 'update-signing-key.pem');

/** Must match `updateSignatureMessage` in the desktop app. */
export const signatureMessage = (version, sha512Hex) =>
  Buffer.from(`evully-update:v1:${version}:${sha512Hex}`, 'utf8');

export function sha512Of(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512');
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

/** Base64 Ed25519 signature of the installer bound to its version. */
export async function signUpdate(file, version, privateKeyPem) {
  const message = signatureMessage(version, await sha512Of(file));
  return sign(null, message, privateKeyPem).toString('base64');
}

function keygen() {
  const file = keyFile();
  if (existsSync(file)) throw new Error(`A key already exists at ${file}; refusing to overwrite.`);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  console.log(`Private key saved to ${file}. Keep a safe copy; never commit it.`);
  console.log('Public key for update-public-key.ts:\n');
  console.log(publicKey.export({ type: 'spki', format: 'pem' }));
}

async function signCommand(file, version) {
  if (!file || !version) throw new Error('Usage: sign <file> <version>');
  const signature = await signUpdate(file, version, readFileSync(keyFile(), 'utf8'));
  writeFileSync(`${file}.sig`, `${signature}\n`);
  console.log(`Signed ${file}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [command, ...args] = process.argv.slice(2);
  const run = command === 'keygen' ? async () => keygen() : () => signCommand(args[0], args[1]);
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
