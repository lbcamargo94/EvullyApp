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
  await session.getByRole('textbox', { name: /^Cintura/ }).fill('92');
  await session.getByRole('button', { name: 'Salvar medidas' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('92');
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
