import { createProfile, expect, go, test } from './fixtures';

test('registers a meal with a food from the catalog', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  await go(page, 'Dieta');
  await page.getByRole('button', { name: 'Pular e usar o padrão' }).click();

  await page.getByRole('tab', { name: 'Alimentos' }).click();
  const food = page.getByRole('region', { name: 'Novo alimento' });
  await food.getByRole('textbox', { name: 'Nome', exact: true }).fill('Arroz branco');
  await food.getByRole('textbox', { name: 'Calorias (kcal)' }).fill('130');
  await food.getByRole('textbox', { name: 'Proteína (g)' }).fill('2,5');
  await food.getByRole('textbox', { name: 'Carboidratos (g)' }).fill('28');
  await food.getByRole('textbox', { name: 'Gorduras (g)' }).fill('0,3');
  await food.getByRole('button', { name: 'Salvar alimento' }).click();
  await expect(page.getByRole('region', { name: 'Catálogo' })).toContainText('Arroz branco');

  await page.getByRole('tab', { name: 'Dia' }).click();
  const lunch = page.getByRole('region', { name: 'Almoço' });
  await lunch.getByRole('button', { name: 'Adicionar alimento' }).click();
  await lunch.getByRole('searchbox').fill('Arroz');
  await lunch.getByRole('button', { name: 'Arroz branco' }).click();
  await lunch.getByRole('textbox', { name: 'Quantidade (g)' }).fill('150');
  await lunch.getByRole('button', { name: 'Adicionar' }).click();

  await expect(lunch).toContainText('Arroz branco');
  // 150 g of 130 kcal per 100 g.
  await expect(page.getByRole('region', { name: 'Total do dia' })).toContainText('195 kcal');
});
