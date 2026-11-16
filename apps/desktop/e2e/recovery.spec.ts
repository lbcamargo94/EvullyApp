import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createProfile, expect, go, launch, registerWeight, test, type Running } from './fixtures';

test('a damaged database opens the recovery screen and a backup brings the data back (README §14.2.1)', async ({
  dataDir,
}) => {
  let running: Running = await launch(dataDir);
  await createProfile(running.page, 'Ana');
  await registerWeight(running.page, '89,8');
  await running.app.close(); // the automatic backup on close

  // Damage the database as a cut write would.
  const db = join(dataDir, 'evully.db');
  for (const suffix of ['-wal', '-shm']) rmSync(`${db}${suffix}`, { force: true });
  writeFileSync(db, Buffer.from('not an sqlite database '.repeat(500)));

  running = await launch(dataDir);
  try {
    const { page, app } = running;
    await expect(
      page.getByRole('heading', { level: 1, name: 'Não foi possível abrir seus dados' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir pasta de logs' })).toBeVisible();
    await page.getByRole('button', { name: 'Restaurar', exact: true }).first().click();
    const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(confirm).toContainText('Ana');
    await expect(confirm).toContainText('evully-danificado');
    await app.evaluate(({ app: electronApp }) => {
      electronApp.relaunch = () => undefined;
    });
    const closed = app.waitForEvent('close');
    await confirm.getByRole('button', { name: 'Substituir e reiniciar' }).click();
    await closed;
  } finally {
    await running.app.close().catch(() => undefined);
  }

  // The damaged file is kept, never deleted.
  expect(readdirSync(dataDir).some((f) => f.startsWith('evully-danificado-'))).toBe(true);

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
