import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import {
  answerOpenDialog,
  answerSaveDialog,
  createProfile,
  expect,
  go,
  launch,
  registerWeight,
  test,
} from './fixtures';

async function openProfileSettings(page: Page): Promise<void> {
  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Perfil' }).click();
}

test('exports the current profile as JSON (README §14.3)', async ({ evully, dataDir }) => {
  const { app, page } = evully;
  await createProfile(page, 'Ana');
  await registerWeight(page, '89,8');
  await openProfileSettings(page);

  const file = join(dataDir, 'export.json');
  await answerSaveDialog(app, file);
  await page.getByRole('button', { name: 'Exportar JSON' }).click();
  await expect(page.getByText('export.json')).toBeVisible();

  const doc = JSON.parse(readFileSync(file, 'utf8'));
  expect(doc.format).toBe('evully-profile-export');
  expect(doc.profile.name).toBe('Ana');
  expect(doc.data.body_weights.map((w: { weight_kg: number }) => w.weight_kg)).toEqual([89.8]);
});

test('moves a profile to another computer (README §14.4)', async ({ evully, dataDir }) => {
  const { app, page } = evully;
  await createProfile(page, 'Ana');
  await registerWeight(page, '62,4');
  await openProfileSettings(page);
  const zip = join(dataDir, 'ana.zip');
  await answerSaveDialog(app, zip);
  await page.getByRole('button', { name: 'Exportar perfil' }).click();
  await expect(page.getByText('ana.zip')).toBeVisible();

  // The other computer: an empty data folder, before any profile exists.
  const otherDir = mkdtempSync(join(tmpdir(), 'evully-e2e-other-'));
  const other = await launch(otherDir);
  try {
    const p = other.page;
    await p.getByRole('button', { name: 'Entendi' }).click();
    await answerOpenDialog(other.app, zip);
    await p.getByRole('button', { name: 'Importar perfil' }).click();
    const dialog = p.getByRole('alertdialog').or(p.getByRole('dialog'));
    await expect(dialog).toContainText('Ana');
    await dialog.getByRole('button', { name: 'Importar perfil' }).click();

    await p.getByRole('button', { name: 'Ana', exact: true }).click();
    await go(p, 'Peso');
    await expect(p.getByRole('region', { name: 'Histórico' })).toContainText('62,4 kg');
  } finally {
    await other.app.close();
    rmSync(otherDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});
