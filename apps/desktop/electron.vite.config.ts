import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';

// Workspace packages ship TypeScript sources, so they are bundled, not externalized.
const workspacePackages = [
  '@evully/app-core',
  '@evully/app-web',
  '@evully/contracts',
  '@evully/domain',
  '@evully/tokens',
  '@evully/ui',
];

// Strict CSP for the packaged app only; the dev server needs inline scripts for HMR.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";

function contentSecurityPolicy(): Plugin {
  return {
    name: 'evully-csp',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig({
  main: {
    build: { externalizeDeps: { exclude: workspacePackages } },
  },
  preload: {
    build: {
      externalizeDeps: { exclude: workspacePackages },
      // Sandboxed preloads cannot be ES modules.
      rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } },
    },
  },
  renderer: {
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  },
});
