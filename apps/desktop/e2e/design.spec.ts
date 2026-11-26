import type { ElectronApplication, Page } from '@playwright/test';
import { createProfile, expect, go, registerWeight, test } from './fixtures';

/**
 * V1.1 validation (docs/design/DESIGN_IMPLEMENTATION.md §12, phase 5): every
 * screen and tab, at the smallest and a large window, in both themes, has no
 * sideways scroll, names every control and keeps keyboard focus visible.
 */

interface View {
  screen: string;
  heading?: string;
  tab?: string;
}

const VIEWS: View[] = [
  { screen: 'Dashboard', heading: 'Olá, Ana' },
  { screen: 'Peso' },
  { screen: 'Medidas' },
  { screen: 'Nutrição', tab: 'Dia' },
  { screen: 'Nutrição', tab: 'Favoritas' },
  { screen: 'Nutrição', tab: 'Alimentos' },
  { screen: 'Treinos', tab: 'Treinar' },
  { screen: 'Treinos', tab: 'Planos' },
  { screen: 'Treinos', tab: 'Exercícios' },
  { screen: 'Cardio' },
  { screen: 'Hábitos', tab: 'Dia' },
  { screen: 'Hábitos', tab: 'Gerenciar' },
  { screen: 'Sono' },
  { screen: 'Progresso' },
  { screen: 'Sinais' },
  ...[
    'Acompanhamento',
    'Projeto',
    'Nutrição',
    'Treino',
    'Sinais',
    'Lembretes',
    'Saúde',
    'Perfil',
    'Geral e backup',
    'Sobre',
  ].map((tab) => ({ screen: 'Configurações', tab })),
];

const label = (v: View) => (v.tab ? `${v.screen} › ${v.tab}` : v.screen);

async function open(page: Page, view: View): Promise<void> {
  await go(page, view.screen, view.heading ?? view.screen);
  // First visit of a module: its questionnaire stands in front of the tabs.
  const skip = page.getByRole('button', { name: /^Pular( e usar o padrão)?$/ });
  if (await skip.isVisible()) await skip.click();
  if (view.tab) await page.getByRole('tab', { name: view.tab, exact: true }).click();
}

async function resize(app: ElectronApplication, width: number, height: number): Promise<void> {
  await app.evaluate(
    ({ BrowserWindow }, [w, h]) => BrowserWindow.getAllWindows()[0]?.setContentSize(w, h),
    [width, height] as const,
  );
}

const setTheme = (page: Page, theme: 'light' | 'dark') =>
  page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);

/** Pixels the page scrolls sideways; 0 when the layout reflows. */
const sidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const INTERACTIVE =
  /^\s*- (button|link|textbox|combobox|checkbox|switch|radio|spinbutton|slider|tab)( \[[^\]]*\])*:?$/;

/** Controls in the accessibility tree without an accessible name. */
async function unnamedControls(page: Page): Promise<string[]> {
  const tree = await page.locator('body').ariaSnapshot();
  return tree.split('\n').filter((line) => INTERACTIVE.test(line));
}

/** Tabs through the screen; every stop must show a focus ring (DESIGN.md §6). */
async function focusStops(page: Page, max: number): Promise<{ stops: number; hidden: string[] }> {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  const seen = new Set<string>();
  const hidden: string[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring =
        (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
        style.boxShadow !== 'none';
      const name =
        el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40) ?? el.tagName;
      return { key: `${el.tagName}:${name}:${el.getBoundingClientRect().top}`, name, ring };
    });
    if (!stop) continue;
    if (seen.has(stop.key)) break;
    seen.add(stop.key);
    if (!stop.ring) hidden.push(stop.name);
  }
  return { stops: seen.size, hidden };
}

test('every screen reflows, names its controls and shows keyboard focus', async ({ evully }) => {
  test.setTimeout(300_000);
  const { app, page } = evully;
  await createProfile(page, 'Ana');
  await registerWeight(page, '89,8');

  const problems: string[] = [];
  for (const [width, height] of [
    [1024, 640],
    [1920, 1080],
  ] as const) {
    await resize(app, width, height);
    for (const view of VIEWS) {
      await open(page, view);
      problems.push(...(await reflowProblems(page, view, width)));
      // Names and focus do not depend on the window size.
      if (width === 1024) problems.push(...(await keyboardProblems(page, view)));
    }
  }
  expect(problems).toEqual([]);
});

async function reflowProblems(page: Page, view: View, width: number): Promise<string[]> {
  const problems: string[] = [];
  for (const theme of ['light', 'dark'] as const) {
    await setTheme(page, theme);
    const extra = await sidewaysScroll(page);
    if (extra > 0) problems.push(`${label(view)} @${width} ${theme}: scrolls ${extra}px sideways`);
  }
  await setTheme(page, 'light');
  return problems;
}

async function keyboardProblems(page: Page, view: View): Promise<string[]> {
  const problems = (await unnamedControls(page)).map(
    (line) => `${label(view)}: control without a name: ${line.trim()}`,
  );
  const { stops, hidden } = await focusStops(page, 40);
  if (stops < 2) problems.push(`${label(view)}: keyboard reaches ${stops} control(s)`);
  for (const name of hidden) problems.push(`${label(view)}: no focus ring on "${name}"`);
  return problems;
}

test('a confirmation dialog keeps focus inside and returns it on close', async ({ evully }) => {
  const { page } = evully;
  await createProfile(page, 'Ana');
  await registerWeight(page, '89,8');

  const remove = page.getByRole('button', { name: /^Excluir/ }).first();
  await remove.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(remove).toBeFocused();
});
