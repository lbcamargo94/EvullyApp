import { createProfile, expect, go, test } from './fixtures';

/** `YYYY-MM-DD` in the machine's time zone (the app's), `offset` days from today. */
function localDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test('a weighing 8 days old raises a signal that explains itself and can be snoozed', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await go(page, 'Peso');
  const form = page.getByRole('region', { name: 'Registrar pesagem' });
  await form.getByRole('textbox', { name: 'Data' }).fill(localDate(-8));
  await form.getByRole('textbox', { name: 'Peso (kg)' }).fill('89,8');
  await form.getByRole('button', { name: 'Salvar pesagem' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('89,8 kg');

  // README §20.2: the Dashboard shows the open signal.
  await go(page, 'Dashboard', 'Olá, Ana');
  await expect(page.getByRole('region', { name: 'Sinais' })).toContainText('Sem pesagem há 8 dias');

  await go(page, 'Sinais');
  const open = page.getByRole('region', { name: 'Abertos' });
  await open.getByText('Por que estou vendo isso?').click();
  await expect(open).toContainText('Regra "Pesagem ausente", versão 1');
  await open.getByRole('button', { name: 'Lembrar em 7 dias' }).click();
  await expect(open).toContainText('Nenhum sinal aberto');
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('Adiado até');

  // Turning the rule off in Settings keeps it quiet.
  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Sinais' }).click();
  const rule = page.getByRole('switch', { name: /Pesagem ausente/ });
  await expect(rule).toBeChecked();
  await rule.uncheck();
  await expect(rule).not.toBeChecked();
});
