import { createProfile, expect, go, test } from './fixtures';

/** `YYYY-MM-DD` in the machine's time zone (the app's), `offset` days from today. */
function localDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test('accepting a tracking suggestion starts tracking the measurement (README §20.2)', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  // The waist barely moves in two sessions 14 days apart.
  await go(page, 'Medidas');
  const session = page.getByRole('region', { name: 'Nova sessão de medidas' });
  for (const [offset, cm] of [
    [-16, '92'],
    [-2, '92,2'],
  ] as const) {
    await session.getByRole('textbox', { name: 'Data' }).fill(localDate(offset));
    await session.getByRole('textbox', { name: 'Cintura', exact: true }).fill(cm);
    await session.getByRole('button', { name: 'Salvar medidas' }).click();
    await expect(page.getByRole('region', { name: 'Histórico' })).toContainText(cm);
  }
  await expect(session.getByRole('textbox', { name: 'Quadril' })).toHaveCount(0);

  await go(page, 'Sinais');
  const open = page.getByRole('region', { name: 'Abertos' });
  await expect(open).toContainText('Cintura estável; acompanhar também Quadril?');
  await open.getByRole('button', { name: 'Aceitar' }).click();
  const dialog = page.getByRole('dialog', { name: 'Acompanhar Quadril?' });
  await expect(dialog).toContainText('Seus registros não mudam');
  await dialog.getByRole('button', { name: 'Acompanhar' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('Aceito');

  await go(page, 'Medidas');
  await expect(
    page.getByRole('region', { name: 'Nova sessão de medidas' }).getByRole('textbox', {
      name: 'Quadril',
    }),
  ).toBeVisible();
});

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
  await expect(page.getByRole('switch', { name: /Ritmo fora da faixa/ })).toBeChecked();

  // The project's optional pace band (README §7.1): both ends, or an error.
  await page.getByRole('tab', { name: 'Projeto' }).click();
  const band = page.getByRole('form', { name: 'Faixa de ritmo (opcional)' });
  await band.getByRole('textbox', { name: 'Mínimo (kg/semana)' }).fill('−0,75');
  await band.getByRole('button', { name: 'Salvar faixa' }).click();
  await expect(band.getByRole('alert')).toContainText('Preencha o mínimo e o máximo');
  await band.getByRole('textbox', { name: 'Máximo (kg/semana)' }).fill('-0,25');
  await band.getByRole('button', { name: 'Salvar faixa' }).click();
  await expect(band.getByRole('status')).toContainText('Salvo.');
  await expect(band.getByRole('button', { name: 'Remover faixa' })).toBeVisible();
});
