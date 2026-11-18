// electron.vite.config.ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
var workspacePackages = [
  "@evully/app-core",
  "@evully/app-web",
  "@evully/contracts",
  "@evully/domain",
  "@evully/tokens",
  "@evully/ui"
];
var CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
function contentSecurityPolicy() {
  return {
    name: "evully-csp",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
        injectTo: "head-prepend"
      }
    ]
  };
}
var electron_vite_config_default = defineConfig({
  main: {
    build: { externalizeDeps: { exclude: workspacePackages } }
  },
  preload: {
    build: {
      externalizeDeps: { exclude: workspacePackages },
      // Sandboxed preloads cannot be ES modules.
      rollupOptions: { output: { format: "cjs", entryFileNames: "[name].cjs" } }
    }
  },
  renderer: {
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
    build: { minify: true }
  }
});
export {
  electron_vite_config_default as default
};
