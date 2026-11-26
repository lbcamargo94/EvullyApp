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
  await form.getByLabel('Laboratório (opcional)').fill('Lab Centro');
  await form.getByRole('combobox', { name: 'Marcador' }).selectOption({ label: 'Ferritina' });
  await expect(form.getByLabel('Unidade')).toHaveValue('ng/mL');
  await form.getByLabel('Valor').fill('22');
  await form.getByLabel('Referência mínima').fill('30');
  await form.getByLabel('Referência máxima').fill('400');
  await form.getByRole('button', { name: 'Salvar exame' }).click();

  const history = page.getByRole('region', { name: 'Exames' });
  await expect(history).toContainText('Ferritina');
  await expect(history).toContainText('Lab Centro');
  await expect(history).toContainText('Atenção: abaixo da referência');
  await expect(history).toContainText('Referência: 30 – 400');
});
