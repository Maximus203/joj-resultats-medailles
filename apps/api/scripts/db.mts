/**
 * pnpm db:seed   applique les migrations, puis charge les fichiers JSON de apps/api/data/
 * pnpm db:reset  vide la base locale, applique les migrations, puis charge les fichiers JSON
 *
 * Même choix de base que l'API : DATABASE_URL défini → PostgreSQL, sinon PGlite (PGLITE_DATA_DIR).
 */
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';
import { seedStatements, tableNameFromFile } from './db-core.mts';

const command = process.argv[2];
if (command !== 'seed' && command !== 'reset') {
  console.error('Usage : node scripts/db.mts seed|reset');
  process.exit(1);
}

if (existsSync('.env')) process.loadEnvFile('.env');
const databaseUrl = process.env['DATABASE_URL'];
const pgliteDataDir = process.env['PGLITE_DATA_DIR'] ?? '.data/pglite';
const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));
const dataDir = fileURLToPath(new URL('../data', import.meta.url));

interface Client {
  query(sql: string, params?: unknown[]): Promise<unknown>;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

async function assertApiStopped(): Promise<void> {
  // PGlite n'accepte qu'un process à la fois sur un dossier : l'API doit être arrêtée.
  const port = process.env['PORT'] ?? '3000';
  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      signal: AbortSignal.timeout(1000),
    });
    const body = (await response.json()) as { database?: string };
    if (body.database === 'pglite') {
      console.error('L’API tourne sur la base PGlite : arrête `pnpm dev` (Ctrl+C), puis relance.');
      process.exit(1);
    }
  } catch {
    // Rien n'écoute, ou ce n'est pas notre API : on continue.
  }
}

function openClient(): Client {
  const hasMigrations = existsSync(`${migrationsFolder}/meta/_journal.json`);
  if (databaseUrl) {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    pool.on('error', (error) => console.warn(`Connexion Postgres perdue : ${error.message}`));
    const db = drizzlePg({ client: pool });
    return {
      query: (sql, params) => pool.query(sql, params),
      migrate: async () => {
        if (hasMigrations) await migratePg(db, { migrationsFolder });
      },
      close: () => pool.end(),
    };
  }
  const client = new PGlite(pgliteDataDir);
  const db = drizzlePglite({ client });
  return {
    query: (sql, params) => client.query(sql, params),
    migrate: async () => {
      if (hasMigrations) await migratePglite(db, { migrationsFolder });
    },
    close: () => client.close(),
  };
}

if (!databaseUrl) await assertApiStopped();

if (command === 'reset' && !databaseUrl) {
  rmSync(pgliteDataDir, { recursive: true, force: true });
}

const client = openClient();
try {
  if (command === 'reset' && databaseUrl) {
    await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
  }
  await client.migrate();

  const files = existsSync(dataDir)
    ? readdirSync(dataDir)
        .filter((file) => file.endsWith('.json'))
        .sort()
    : [];
  for (const file of files) {
    const table = tableNameFromFile(file);
    const statements = seedStatements(
      table,
      JSON.parse(readFileSync(`${dataDir}/${file}`, 'utf8')),
    );
    for (const { sql, params } of statements) {
      await client.query(sql, params);
    }
    console.log(`${table} : ${statements.length} ligne(s) chargée(s) (les doublons sont ignorés)`);
  }
  const target = databaseUrl ? 'PostgreSQL' : `PGlite (${pgliteDataDir})`;
  console.log(`${command === 'reset' ? 'Base remise à zéro' : 'Seed terminé'} : ${target}`);
} finally {
  await client.close();
}
