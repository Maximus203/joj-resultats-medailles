import { defineConfig } from 'vitest/config';

// `pnpm test` lance tous les projets en un seul process ; chaque projet a sa propre config.
export default defineConfig({
  test: {
    projects: ['apps/*', 'packages/*', '.claude/hooks'],
  },
});
