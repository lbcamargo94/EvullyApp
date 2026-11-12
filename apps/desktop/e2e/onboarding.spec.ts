import { createProfile, expect, test } from './fixtures';

test('creates a profile, answers the questionnaire and accepts the proposal', async ({
  evully,
}) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await expect(page.getByRole('region', { name: 'Projeto atual' })).toContainText('Projeto de Ana');
  // The accepted proposal shows the trend and the suggested measurements.
  await expect(page.getByRole('region', { name: 'Tendência' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cintura' })).toBeVisible();
});

test('the first Tab stop skips to the content (DESIGN.md §6)', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('button', { name: 'Pular para o conteúdo' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
