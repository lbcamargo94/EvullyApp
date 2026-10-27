import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// The publishing script signs; the app verifies. Both must agree on the format.
import { signUpdate } from '../../../scripts/update-signing.mjs';
import { verifyUpdateFile } from '../src/modules/updates/adapters/update-signature';
import { createTestApp } from './helpers';

const keys = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  return {
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  };
};

describe('update signatures (SECURITY.md §2.8)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'evully-update-'));
  afterEach(() => rmSync(join(dir, 'setup.exe'), { force: true }));

  const installer = (content: string) => {
    const file = join(dir, 'setup.exe');
    writeFileSync(file, content);
    return file;
  };

  it('accepts the file signed for its version with the matching key', async () => {
    const { privatePem, publicPem } = keys();
    const file = installer('installer bytes');
    const signature = await signUpdate(file, '0.5.0-alpha.3', privatePem);
    expect(await verifyUpdateFile(file, '0.5.0-alpha.3', signature, publicPem)).toBe(true);
  });

  it('rejects a changed file, another version, another key or garbage', async () => {
    const { privatePem, publicPem } = keys();
    const file = installer('installer bytes');
    const signature = await signUpdate(file, '0.5.0', privatePem);

    expect(await verifyUpdateFile(file, '0.6.0', signature, publicPem)).toBe(false);
    expect(await verifyUpdateFile(file, '0.5.0', signature, keys().publicPem)).toBe(false);
    expect(await verifyUpdateFile(file, '0.5.0', 'not-a-signature', publicPem)).toBe(false);
    expect(await verifyUpdateFile(file, '../0.5.0', signature, publicPem)).toBe(false);
    installer('tampered bytes');
    expect(await verifyUpdateFile(file, '0.5.0', signature, publicPem)).toBe(false);
  });
});

describe('update channel setting', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  it('defaults to pre-releases and can switch to stable', async () => {
    const app = await createTestApp();
    dispose = app.dispose;
    expect((await app.handlers['settings:get'](undefined)).updateChannel).toBe('prerelease');
    const updated = await app.handlers['settings:update']({ updateChannel: 'stable' });
    expect(updated.updateChannel).toBe('stable');
    expect((await app.handlers['updates:status'](undefined)).state).toBe('disabled');
  });
});
