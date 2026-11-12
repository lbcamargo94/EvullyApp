import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { createProfile, expect, go, launch, registerWeight, test, type Running } from './fixtures';

async function switchTo(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /^Trocar de perfil/ }).click();
  await page.getByRole('menuitem', { name: 'Ver todos os perfis' }).click();
  await page.getByRole('button', { name, exact: true }).click();
}

test('switching profiles keeps each one’s data apart', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  await registerWeight(page, '62,4');

  await page.getByRole('button', { name: /^Trocar de perfil/ }).click();
  await page.getByRole('menuitem', { name: 'Ver todos os perfis' }).click();
  await page.getByRole('button', { name: 'Adicionar perfil' }).click();
  await createProfile(page, 'Lucas');
  await go(page, 'Peso');
  const history = page.getByRole('region', { name: 'Histórico' });
  await expect(history).toContainText('Nenhuma pesagem ainda.');
  await registerWeight(page, '89,8');

  await switchTo(page, 'Ana');
  await go(page, 'Peso');
  await expect(history).toContainText('62,4 kg');
  await expect(history).not.toContainText('89,8 kg');
});

test('data and the automatic backup survive closing and reopening', async ({ dataDir }) => {
  let running: Running = await launch(dataDir);
  await createProfile(running.page, 'Ana');
  await registerWeight(running.page, '89,8');
  await running.app.close();

  // Automatic backup on close (README §8.7.2).
  const backups = readdirSync(join(dataDir, 'backups')).filter((f) =>
    f.startsWith('evully-backup-'),
  );
  expect(backups.length).toBeGreaterThan(0);

  running = await launch(dataDir);
  try {
    const { page } = running;
    await page.getByRole('button', { name: 'Ana', exact: true }).click();
    await go(page, 'Peso');
    await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('89,8 kg');
  } finally {
    await running.app.close();
  }
});
