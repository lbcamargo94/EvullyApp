import { createProfile, expect, go, test } from './fixtures';

test('turns reminders on for the profile, with quiet hours (README §25)', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');

  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Lembretes' }).click();
  const form = page.getByRole('form', { name: 'Lembretes' });
  const weighing = form.getByRole('switch', { name: /Pesagem/ });
  await expect(weighing).not.toBeChecked();
  await weighing.check();
  await form.getByLabel('Horário (pesagem)').fill('06:45');
  await form.getByRole('switch', { name: /Medidas/ }).check();
  await form.getByRole('combobox', { name: 'Dia da semana' }).selectOption({ label: 'Sábado' });
  await form.getByRole('switch', { name: /Horário silencioso/ }).check();
  await form.getByLabel('Início').fill('23:00');
  await form.getByRole('switch', { name: /Água/ }).check();
  await form.getByLabel('Horário (água)').fill('16:30');
  await form.getByRole('button', { name: 'Salvar lembretes' }).click();
  await expect(form.getByRole('status')).toContainText('Salvo.');
  await expect(page.getByRole('switch', { name: /Iniciar com o Windows/ })).not.toBeChecked();

  // Saved for this profile: coming back shows the same choices.
  await go(page, 'Dashboard', 'Olá, Ana');
  await go(page, 'Configurações');
  await page.getByRole('tab', { name: 'Lembretes' }).click();
  await expect(form.getByRole('switch', { name: /Pesagem/ })).toBeChecked();
  await expect(form.getByLabel('Horário (pesagem)')).toHaveValue('06:45');
  await expect(form.getByRole('combobox', { name: 'Dia da semana' })).toHaveValue('6');
  await expect(form.getByLabel('Início')).toHaveValue('23:00');
  await expect(form.getByLabel('Horário (água)')).toHaveValue('16:30');
  await expect(form.getByRole('switch', { name: /Treino/ })).not.toBeChecked();
  await expect(form.getByRole('switch', { name: /Sono/ })).not.toBeChecked();
});
