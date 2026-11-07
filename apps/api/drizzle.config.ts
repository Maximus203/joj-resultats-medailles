import { defineConfig } from 'drizzle-kit';

// `pnpm db:generate` compare ces schémas aux migrations existantes et écrit la suivante.
// Les migrations sont générées, jamais éditées à la main.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infra/*.schema.ts',
  out: './migrations',
  strict: true,
});
