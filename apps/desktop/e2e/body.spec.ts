import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { answerOpenDialog, createProfile, expect, go, test } from './fixtures';

test('registers a weight and a measurement session', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await go(page, 'Peso');
  const form = page.getByRole('region', { name: 'Registrar pesagem' });
  await form.getByRole('textbox', { name: 'Peso (kg)' }).fill('89,8');
  await form.getByRole('button', { name: 'Salvar pesagem' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('89,8 kg');

  await go(page, 'Medidas');
  const session = page.getByRole('region', { name: 'Nova sessão de medidas' });
  await session.getByRole('textbox', { name: 'Cintura', exact: true }).fill('92');
  await session.getByRole('button', { name: 'Salvar medidas' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('92');

  // README §20.1: this period against the one before, with no estimate.
  await go(page, 'Progresso');
  const comparison = page.getByRole('region', { name: 'Comparar períodos' });
  await expect(comparison).toContainText('1 de 30');
  await expect(comparison).toContainText('92,0 cm');
  await comparison.getByRole('button', { name: '7 dias' }).click();
  await expect(comparison.getByRole('columnheader', { name: 'Últimos 7 dias' })).toBeVisible();
  await expect(comparison).toContainText('1 de 7');
});

test('from the dashboard to a saved weighing with the keyboard only (README §33.2)', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await page.getByRole('link', { name: 'Registrar peso' }).click();
  await expect(page.getByRole('textbox', { name: 'Peso (kg)' })).toBeFocused();
  await page.keyboard.type('89,8');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('89,8 kg');

  await go(page, 'Dashboard', 'Olá, Ana');
  await page.getByRole('link', { name: 'Registrar medidas' }).click();
  const waist = page.getByRole('textbox', { name: 'Cintura', exact: true });
  await expect(waist).toBeFocused();
  // The "how to measure" hint is the field's description, not part of its name.
  await expect(waist).toHaveAccessibleDescription(/Parte mais estreita do tronco/);
});

test('imports weighings from a CSV after the preview', async ({ evully, dataDir }) => {
  const { app, page } = evully;
  await createProfile(page, 'Ana');
  const csv = join(dataDir, 'pesos.csv');
  writeFileSync(
    csv,
    'data;hora;peso_kg;observacao\r\n01/11/2026;07:30;90,4;\r\n02/11/2026;07:30;90,1;\r\n',
  );

  await go(page, 'Peso');
  await page.getByRole('link', { name: 'Importar CSV' }).click();
  await answerOpenDialog(app, csv);
  await page.getByRole('button', { name: 'Escolher arquivo CSV' }).click();
  await expect(page.getByText('pesos.csv')).toBeVisible();
  await page.getByRole('button', { name: /^Importar/ }).click();

  await go(page, 'Peso');
  const history = page.getByRole('region', { name: 'Histórico' });
  await expect(history).toContainText('90,4 kg');
  await expect(history).toContainText('90,1 kg');
});
