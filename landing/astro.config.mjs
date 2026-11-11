import { defineConfig } from 'astro/config';

export default defineConfig({
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
