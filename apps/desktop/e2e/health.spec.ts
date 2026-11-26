import { createProfile, expect, go, test } from './fixtures';

test('turns Saúde on after the notice and flags a result out of the lab range (README §24)', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  const menu = page.getByRole('navigation', { name: 'Menu principal' });
  await expect(menu.getByRole('link', { name: 'Saúde', exact: true })).toHaveCount(0);

  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Saúde' }).click();
  // The switch turns on only after the notice is accepted.
  await page.getByRole('switch', { name: /Mostrar a área Saúde/ }).click();
  const notice = page.getByRole('dialog', { name: 'Antes de ligar a área Saúde' });
  await expect(notice).toContainText('não substitui a avaliação de um profissional');
  await notice.getByRole('button', { name: 'Entendi, ligar' }).click();
  await expect(page.getByRole('switch', { name: /Mostrar a área Saúde/ })).toBeChecked();

  await go(page, 'Saúde');
  const form = page.getByRole('form', { name: 'Novo exame' });
  const ferritin = async (collectedOn: string, value: string) => {
    await form.getByLabel('Data da coleta').fill(collectedOn);
    await form.getByLabel('Laboratório (opcional)').fill('Lab Centro');
    await form.getByRole('combobox', { name: 'Marcador' }).selectOption({ label: 'Ferritina' });
    await expect(form.getByLabel('Unidade')).toHaveValue('ng/mL');
    await form.getByLabel('Valor').fill(value);
    await form.getByLabel('Referência mínima').fill('30');
    await form.getByLabel('Referência máxima').fill('400');
    await form.getByRole('button', { name: 'Salvar exame' }).click();
    await expect(form.getByText('Exame salvo.')).toBeVisible();
  };
  await ferritin('2026-01-10', '22');

  const history = page.getByRole('region', { name: 'Exames' });
  await expect(history).toContainText('Ferritina');
  await expect(history).toContainText('Lab Centro');
  await expect(history).toContainText('Atenção: abaixo da referência');
  await expect(history).toContainText('Referência: 30 – 400');
});

test('reads a marker over two exams and compares them (README §24.3)', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Bia');
  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Saúde' }).click();
  await page.getByRole('switch', { name: /Mostrar a área Saúde/ }).click();
  await page.getByRole('button', { name: 'Entendi, ligar' }).click();

  await go(page, 'Saúde');
  const form = page.getByRole('form', { name: 'Novo exame' });
  for (const [collectedOn, value] of [
    ['2026-01-10', '22'],
    ['2026-03-10', '25,5'],
  ] as const) {
    await form.getByLabel('Data da coleta').fill(collectedOn);
    await form.getByRole('combobox', { name: 'Marcador' }).selectOption({ label: 'Ferritina' });
    await form.getByLabel('Valor').fill(value);
    await form.getByLabel('Referência mínima').fill('30');
    await form.getByLabel('Referência máxima').fill('400');
    await form.getByRole('button', { name: 'Salvar exame' }).click();
    await expect(form.getByText('Exame salvo.')).toBeVisible();
  }

  await page.getByRole('tab', { name: 'Marcadores' }).click();
  const detail = page.getByRole('region', { name: 'Histórico de Ferritina' });
  await expect(detail).toContainText('Avaliação profissional recomendada');
  await expect(detail).toContainText('Subiu desde o exame anterior');
  await expect(detail).toContainText('reservas de ferro');
  await expect(detail).toContainText('Perguntas para levar ao profissional');

  await page.getByRole('tab', { name: 'Comparar' }).click();
  const table = page.getByRole('table', { name: 'Comparar exames' });
  await expect(table).toContainText('Ferritina');
  await expect(table).toContainText('+3,5');
});
