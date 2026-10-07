import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Builds a `no-restricted-imports` rule for an architecture boundary (ARCHITECTURE.md §8). */
const forbid = (layer, patterns) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: patterns.map((group) => ({
        group: [group],
        message: `${layer} must not import ${group} (ARCHITECTURE.md §8).`,
      })),
    },
  ],
});

const node = ['node:*', 'fs', 'path', 'os', 'child_process'];
const infra = ['kysely', 'better-sqlite3', 'electron', 'electron-log*', '@nestjs/*'];
const ui = ['react', 'react-dom', 'react-dom/*', '@radix-ui/*', '@evully/ui', '@evully/app-web'];

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/out/**', '**/dist/**', '**/release/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      complexity: ['error', 12],
      'max-depth': ['error', 3],
    },
  },
  {
    files: ['**/*.tsx', 'packages/app-core/**/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['packages/domain/src/**'],
    rules: forbid('packages/domain', [...node, ...infra, ...ui, 'zod', '@evully/*']),
  },
  {
    files: ['packages/contracts/src/**'],
    rules: forbid('packages/contracts', [...node, ...infra, ...ui, '@evully/*']),
  },
  {
    files: ['packages/app-core/src/**'],
    rules: forbid('packages/app-core', [
      ...node,
      ...infra,
      'react-dom',
      'react-dom/*',
      'react-native',
      '@radix-ui/*',
      '@evully/ui',
      '@evully/app-web',
    ]),
  },
  {
    files: ['packages/ui/src/**'],
    rules: forbid('packages/ui', [...node, ...infra, '@evully/app-*', '@evully/domain']),
  },
  {
    files: ['packages/app-web/src/**'],
    rules: forbid('packages/app-web', [...node, ...infra]),
  },
  {
    files: ['apps/desktop/src/renderer/**'],
    rules: forbid('the desktop renderer', [...node, ...infra.filter((p) => p !== 'electron')]),
  },
);
