import { defineConfig } from 'vitest/config';

// `npm run seed`: Vitest only runs the TypeScript seed under Electron's Node,
// like the tests, so better-sqlite3 uses the app's native build.
export default defineConfig({
  test: {
    include: ['seed/run.seed.ts'],
    environment: 'node',
    pool: 'forks',
  },
});
