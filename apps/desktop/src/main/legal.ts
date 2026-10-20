import type { LegalDocuments } from '@evully/contracts';
import { app } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Installed app: copied to resources by electron-builder. Development: the repository root. */
const legalDirectory = () =>
  app.isPackaged ? process.resourcesPath : join(app.getAppPath(), '..', '..');

const read = (name: string) => readFile(join(legalDirectory(), name), 'utf8').catch(() => '');

/** LICENSE and THIRD_PARTY_NOTICES for Settings › Sobre. Fixed file names, never from the renderer. */
export async function readLegalDocuments(): Promise<LegalDocuments> {
  const [license, thirdPartyNotices] = await Promise.all([
    read('LICENSE'),
    read('THIRD_PARTY_NOTICES'),
  ]);
  return { license, thirdPartyNotices };
}
