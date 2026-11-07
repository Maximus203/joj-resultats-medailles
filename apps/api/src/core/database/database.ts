import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { Logger } from '@nestjs/common';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { Pool } from 'pg';

/** Instance Drizzle commune aux deux modes : le code applicatif ne sait pas lequel tourne. */
export type Database = PgDatabase<PgQueryResultHKT>;

export interface DatabaseConnection {
  readonly mode: 'pglite' | 'postgres';
  readonly db: Database;
  /** Applique les migrations de apps/api/migrations qui ne le sont pas encore. */
  migrate(): Promise<void>;
  close(): Promise<void>;
}

/** apps/api/migrations, depuis src/core/database comme depuis dist/core/database. */
export const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'migrations');

export interface DatabaseOptions {
  databaseUrl?: string | undefined;
  pgliteDataDir: string;
}

export function openDatabase({ databaseUrl, pgliteDataDir }: DatabaseOptions): DatabaseConnection {
  if (databaseUrl) {
    const pool = new Pool({ connectionString: databaseUrl });
    // Une connexion inactive coupée par le serveur (redémarrage de Postgres) émet `error` : sans
    // écouteur, le process plante. Le pool la remplace à la demande suivante.
    pool.on('error', (error) =>
      new Logger('Database').warn(`Connexion Postgres perdue : ${error.message}`),
    );
    const db = drizzlePg({ client: pool });
    return {
      mode: 'postgres',
      db,
      migrate: async () => {
        if (hasMigrations()) await migratePg(db, { migrationsFolder: MIGRATIONS_DIR });
      },
      close: () => pool.end(),
    };
  }

  if (!pgliteDataDir.startsWith('memory://')) {
    mkdirSync(pgliteDataDir, { recursive: true });
  }
  const client = new PGlite(pgliteDataDir);
  const db = drizzlePglite({ client });
  return {
    mode: 'pglite',
    db,
    migrate: async () => {
      if (hasMigrations()) await migratePglite(db, { migrationsFolder: MIGRATIONS_DIR });
    },
    close: () => client.close(),
  };
}

/** Aucune migration tant que `pnpm db:generate` n'a jamais été lancé. */
function hasMigrations(): boolean {
  return existsSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'));
}
