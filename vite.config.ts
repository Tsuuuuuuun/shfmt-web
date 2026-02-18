import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    target: "es2020",
    assetsInlineLimit: 0,
  },
  server: {
    headers: {
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src https://fonts.gstatic.com; connect-src 'self'; " +
        "img-src 'self'; object-src 'none'; base-uri 'self';",
    },
  },
});
