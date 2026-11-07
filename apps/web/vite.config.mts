/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    // Génère src/routeTree.gen.ts à partir des fichiers de src/routes.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      // Les tests d'une route peuvent vivre à côté d'elle sans devenir une route.
      routeFileIgnorePattern: '\\.test\\.',
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true,
    // Le front appelle /api/... ; Vite transmet à l'API, sans souci de CORS.
    proxy: {
      '/api': process.env['API_URL'] ?? 'http://localhost:3000',
    },
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // Pas de CSS dans jsdom : plus rapide, et aucun test ne doit dépendre d'un style.
    css: false,
    // Chaque `vi.spyOn` est défait après son test.
    restoreMocks: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
