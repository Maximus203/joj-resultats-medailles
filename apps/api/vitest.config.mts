import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Obligatoire : sans SWC, Vitest (oxc) n'émet pas les métadonnées de décorateurs, et
    // l'injection de dépendances de Nest ne trouve pas les paramètres des constructeurs.
    swc.vite({
      swcrc: false,
      tsconfigFile: false,
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2023',
        keepClassNames: true,
      },
      module: { type: 'es6' },
    }),
  ],
  test: {
    name: 'api',
    root: import.meta.dirname,
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'scripts/**/*.spec.mts'],
    environment: 'node',
    // Démarrer PGlite (WebAssembly) prend un peu de temps sur une machine modeste.
    hookTimeout: 30_000,
    testTimeout: 15_000,
  },
});
