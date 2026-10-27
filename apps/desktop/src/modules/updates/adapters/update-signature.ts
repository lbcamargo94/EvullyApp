import { createHash, verify } from 'node:crypto';
import { createReadStream } from 'node:fs';

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

/** Signed text: binds the installer hash to its version, so an old installer cannot pass as new. */
export const updateSignatureMessage = (version: string, sha512Hex: string) =>
  Buffer.from(`evully-update:v1:${version}:${sha512Hex}`, 'utf8');

export const isUpdateVersion = (version: string) => VERSION.test(version);

function sha512Of(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512');
    createReadStream(file)
      .on('data', (chunk) => hash.update(chunk))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

/** True only when the base64 Ed25519 signature matches the file and version. */
export async function verifyUpdateFile(
  file: string,
  version: string,
  signatureBase64: string,
  publicKeyPem: string,
): Promise<boolean> {
  if (!isUpdateVersion(version)) return false;
  const signature = Buffer.from(signatureBase64.trim(), 'base64');
  if (signature.length !== 64) return false;
  try {
    return verify(
      null,
      updateSignatureMessage(version, await sha512Of(file)),
      publicKeyPem,
      signature,
    );
  } catch {
    return false;
  }
}
