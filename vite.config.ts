import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  envPrefix: ['VITE_', 'GOOGLE_MAPS_'],
  resolve: {
    alias: {
      './astronomy.js': path.resolve('./src/core/astronomy.browser.ts'),
      '../core/astronomy.js': path.resolve('./src/core/astronomy.browser.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});
