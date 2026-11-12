import { createProfile, expect, go, test } from './fixtures';

test('registers cardio, a habit and a night of sleep, then sees them in Estatísticas', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await go(page, 'Cardio');
  const cardio = page.getByRole('region', { name: 'Registrar cardio' });
  await cardio.getByRole('combobox', { name: 'Atividade' }).selectOption({ label: 'Corrida' });
  await cardio.getByRole('textbox', { name: 'Duração (min)' }).fill('30');
  await cardio.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('Corrida');
  await expect(page.getByRole('region', { name: 'Esta semana' })).toContainText('30 min');

  await go(page, 'Hábitos');
  await page.getByRole('button', { name: 'Adicionar exemplos' }).click();
  const day = page.getByRole('tabpanel', { name: 'Dia' });
  await expect(day.getByRole('checkbox').first()).toBeVisible();
  // The checkbox shows the saved state, so it turns checked when the save returns.
  await day.getByRole('checkbox').first().click();
  await expect(day.getByRole('checkbox').first()).toBeChecked();

  await go(page, 'Sono');
  const night = page.getByRole('region', { name: 'Registrar noite' });
  await night.getByRole('textbox', { name: 'Deitou' }).fill('23:00');
  await night.getByRole('textbox', { name: 'Acordou', exact: true }).fill('07:00');
  await expect(night).toContainText('8h00');
  await night.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText('8h00');

  await go(page, 'Estatísticas');
  await page
    .getByRole('group', { name: 'Período' })
    .getByRole('button', { name: '30 dias' })
    .click();
  await expect(page.getByRole('img', { name: /sono/i })).toBeVisible();
  await expect(page.getByRole('img', { name: /cardio/i })).toBeVisible();
});
