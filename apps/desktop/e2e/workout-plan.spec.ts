import type { Page } from '@playwright/test';
import { createProfile, expect, go, test } from './fixtures';

/** Fills every set of `exercise` with `kg` × `reps` at RIR 2 and marks it done. */
async function doAllSets(page: Page, exercise: string, kg: string, reps: string): Promise<void> {
  const row = page.getByRole('region', { name: exercise });
  for (const n of [1, 2, 3]) {
    await row.getByRole('textbox', { name: `Série ${n}: Carga (kg)` }).fill(kg);
    await row.getByRole('textbox', { name: `Série ${n}: Reps` }).fill(reps);
    await row.getByRole('textbox', { name: `Série ${n}: RIR` }).fill('2');
    await row.getByRole('checkbox', { name: `Série ${n} concluída` }).check();
  }
}

async function startDay(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Treinar' }).click();
  await page.getByRole('button', { name: /^Treino A/ }).click();
}

test('creates a plan, trains it, sees the history and the progression suggestion (README §19)', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  await go(page, 'Treinos');
  await page.getByRole('button', { name: 'Pular', exact: true }).click();

  // A plan of its own: one day, one exercise, 3 × 8–12.
  await page.getByRole('textbox', { name: 'Nome do plano' }).fill('Meu plano');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar dia' }).click();
  await page.getByRole('textbox', { name: 'Nome do dia' }).fill('Treino A');
  await page.getByRole('tabpanel').getByRole('button', { name: 'Adicionar dia' }).last().click();
  const day = page.getByRole('region', { name: 'Treino A' });
  await day.getByRole('button', { name: 'Adicionar exercício' }).click();
  await day.getByRole('searchbox', { name: 'Buscar exercício na biblioteca' }).fill('Supino reto');
  await day.getByRole('button', { name: /^Supino reto/ }).click();
  await expect(day.getByRole('textbox', { name: 'Séries' })).toHaveValue('3');
  await day.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await expect(day).toContainText('Supino reto');

  // First session: every set at the top of the range, with load, reps and RIR.
  await startDay(page);
  await doAllSets(page, 'Supino reto', '40', '12');
  await page.getByRole('button', { name: 'Finalizar treino' }).click();
  await expect(page.getByRole('region', { name: 'Iniciar treino' })).toBeVisible();

  // Next session: the history and the deterministic suggestion (README §10).
  await startDay(page);
  const exercise = page.getByRole('region', { name: 'Supino reto' });
  await expect(exercise).toContainText('40');
  await expect(exercise).toContainText('Sugestão: considere aumentar a carga');
  await expect(exercise).toContainText('Você decide.');

  // The exercise history: last session and best load.
  await page.getByRole('button', { name: 'Descartar treino' }).click();
  await page
    .getByRole('alertdialog')
    .or(page.getByRole('dialog'))
    .getByRole('button', { name: /Descartar/ })
    .click();
  await page.getByRole('tab', { name: 'Exercícios' }).click();
  await page.getByRole('searchbox').first().fill('Supino reto');
  await page.getByRole('button', { name: /histórico de Supino reto/i }).click();
  const history = page.getByRole('region', { name: 'Histórico' });
  await expect(history).toContainText('Melhor carga');
  await expect(history).toContainText('40 kg');
});
