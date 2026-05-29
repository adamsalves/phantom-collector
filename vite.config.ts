import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    assetsInlineLimit: 0, // Garante que spritesheets não sejam inlined como base64
    outDir: 'dist'
  }
});
