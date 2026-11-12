import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Page,
} from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = fileURLToPath(new URL('..', import.meta.url));

/** A running Evully on a given data folder. */
export interface Running {
  app: ElectronApplication;
  page: Page;
}

/** Starts the built app on `dataDir` (EVULLY_DATA_DIR, honored only outside the installed app). */
export async function launch(dataDir: string): Promise<Running> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== 'ELECTRON_RUN_AS_NODE') env[key] = value;
  }
  env['EVULLY_DATA_DIR'] = dataDir;
  const app = await electron.launch({ args: ['.'], cwd: desktopDir, env });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  return { app, page };
}

/** A fresh, empty data folder per test, removed afterwards. */
export const test = base.extend<{ dataDir: string; evully: Running }>({
  // eslint-disable-next-line no-empty-pattern
  dataDir: async ({}, use) => {
    const dir = mkdtempSync(join(tmpdir(), 'evully-e2e-'));
    await use(dir);
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  },
  evully: async ({ dataDir }, use, testInfo) => {
    const running = await launch(dataDir);
    const tracing = running.app.context().tracing;
    await tracing.start({ screenshots: true, snapshots: true });
    await use(running);
    const failed = testInfo.status !== testInfo.expectedStatus;
    await tracing.stop(failed ? { path: testInfo.outputPath('trace.zip') } : {});
    await running.app.close().catch(() => undefined);
  },
});

export { expect };

/** Goes to a screen through the main menu; `heading` is its title when it differs from the link. */
export async function go(page: Page, name: string, heading: string | RegExp = name): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Menu principal' })
    .getByRole('link', { name, exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

/**
 * Creates a profile and accepts the tracking proposal (README §8.2): goal
 * "Perder gordura", a project, the suggested measurements and the trend view.
 */
export async function createProfile(page: Page, name: string): Promise<void> {
  const notice = page.getByRole('button', { name: 'Entendi' });
  const form = page.getByRole('textbox', { name: 'Nome', exact: true });
  await expect(notice.or(form)).toBeVisible();
  if (await notice.isVisible()) await notice.click();
  await form.fill(name);
  await page.getByRole('button', { name: 'Criar perfil' }).click();

  await expect(page.getByRole('heading', { name: 'Qual é o seu objetivo agora?' })).toBeVisible();
  await page.getByRole('radio', { name: /^Perder gordura/ }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('textbox', { name: 'Nome do projeto' }).fill(`Projeto de ${name}`);
  const steps = page.getByRole('button', { name: 'Continuar' });
  // The remaining steps keep their suggested answers.
  while (await page.getByRole('button', { name: 'Ver resumo' }).isHidden()) {
    await steps.click();
  }
  await page.getByRole('button', { name: 'Ver resumo' }).click();
  await expect(page.getByRole('heading', { name: 'Seu Evully ficará assim' })).toBeVisible();
  await page.getByRole('button', { name: 'Aceitar e começar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: `Olá, ${name}` })).toBeVisible();
}

/** Registers a weighing on Peso and waits for it in the history. */
export async function registerWeight(page: Page, kg: string): Promise<void> {
  await go(page, 'Peso');
  const form = page.getByRole('region', { name: 'Registrar pesagem' });
  await form.getByRole('textbox', { name: 'Peso (kg)' }).fill(kg);
  await form.getByRole('button', { name: 'Salvar pesagem' }).click();
  await expect(page.getByRole('region', { name: 'Histórico' })).toContainText(`${kg} kg`);
}

/** Makes the next native "open file" dialog return `filePath`. */
export async function answerOpenDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [path],
    })) as typeof dialog.showOpenDialog;
  }, filePath);
}

/** Makes the next native "save file" dialog return `filePath`. */
export async function answerSaveDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, path) => {
    dialog.showSaveDialog = (async () => ({
      canceled: false,
      filePath: path,
    })) as typeof dialog.showSaveDialog;
  }, filePath);
}
