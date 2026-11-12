import { defineConfig } from '@playwright/test';

// End-to-end flows of README §18.3 on the built app (`npm run build` first).
// One Electron instance at a time: each test gets its own empty data folder.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['github']] : 'list',
  outputDir: 'test-results',
});
