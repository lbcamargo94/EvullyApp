import { defineConfig } from 'vitest/config';

// Runs under Electron's Node (ELECTRON_RUN_AS_NODE) so better-sqlite3 uses the
// same native build as the app.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
  },
});
