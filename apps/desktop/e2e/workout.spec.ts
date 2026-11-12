import { createProfile, expect, go, test } from './fixtures';

test('starts a workout, saves a set and finishes it', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  await go(page, 'Treinos');
  await page.getByRole('button', { name: 'Pular', exact: true }).click();

  await page
    .getByRole('combobox', { name: 'Importar plano-modelo' })
    .selectOption({ label: 'Core em casa (3× por semana)' });
  await page.getByRole('button', { name: 'Importar', exact: true }).click();
  await page.getByRole('tab', { name: 'Treinar' }).click();
  await page.getByRole('button', { name: /^Core \(3× por semana\)/ }).click();

  const exercise = page.getByRole('region', { name: 'Abdominal reverso' });
  await exercise.getByRole('textbox', { name: 'Série 1: Reps' }).fill('15');
  await exercise.getByRole('checkbox', { name: 'Série 1 concluída' }).click();
  await expect(exercise.getByRole('checkbox', { name: 'Série 1 concluída' })).toBeChecked();

  await page.getByRole('button', { name: 'Finalizar treino' }).click();
  // Finished: the tab offers a new workout again.
  await expect(page.getByRole('region', { name: 'Iniciar treino' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Finalizar treino' })).toBeHidden();

  // The dashboard's "Hoje" card knows today's workout is done.
  await go(page, 'Dashboard', 'Olá, Ana');
  await expect(page.getByRole('region', { name: 'Hoje' })).toContainText('Treino concluído hoje.');
});
