import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  answerSaveDialog,
  createProfile,
  expect,
  go,
  launch,
  registerWeight,
  test,
  type Running,
} from './fixtures';

test('makes a manual backup and restores it (README §8.7, §14.2)', async ({ dataDir }) => {
  let running: Running = await launch(dataDir);
  try {
    const { page, app } = running;
    await createProfile(page, 'Ana');
    await registerWeight(page, '89,8');

    await go(page, 'Configurações');
    await page.getByRole('tab', { name: 'Geral e backup' }).click();
    // Saved in the default folder, where "Restaurar backup" lists it.
    const folder = join(dataDir, 'backups');
    mkdirSync(folder, { recursive: true });
    await answerSaveDialog(app, join(folder, 'evully-backup-manual.zip'));
    await page.getByRole('button', { name: 'Fazer backup agora' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'evully-backup-manual.zip' }),
    ).toBeVisible();

    // A weighing after the backup: restoring must bring the database back to before it.
    await registerWeight(page, '88,1');
    await go(page, 'Configurações');
    await page.getByRole('tab', { name: 'Geral e backup' }).click();
    await page.getByRole('button', { name: 'Escolher backup' }).click();
    await page
      .getByRole('button', { name: /^Restaurar/ })
      .first()
      .click();
    const confirm = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(confirm).toContainText('Ana');
    // The app restarts itself after a restore; here the test reopens it instead.
    await app.evaluate(({ app: electronApp }) => {
      electronApp.relaunch = () => undefined;
    });
    const closed = app.waitForEvent('close');
    await confirm.getByRole('button', { name: 'Substituir e reiniciar' }).click();
    await closed;
  } finally {
    await running.app.close().catch(() => undefined);
  }

  running = await launch(dataDir);
  try {
    const { page } = running;
    await page.getByRole('button', { name: 'Ana', exact: true }).click();
    await go(page, 'Peso');
    const history = page.getByRole('region', { name: 'Histórico' });
    await expect(history).toContainText('89,8 kg');
    await expect(history).not.toContainText('88,1 kg');
  } finally {
    await running.app.close();
  }
  // The state before the restore was kept as its own backup.
  const kinds = readdirSync(join(dataDir, 'backups'));
  expect(kinds.length).toBeGreaterThanOrEqual(2);
});
