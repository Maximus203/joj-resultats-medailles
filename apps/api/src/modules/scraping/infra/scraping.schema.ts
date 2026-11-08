// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { index, integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import type { ScrapeReport } from '../domain/scrape-run';

/** Une ligne par exécution de l'import : les compteurs se lisent sans ouvrir le détail. */
export const scrapeRuns = pgTable(
  'scrape_runs',
  {
    id: uuid('id').primaryKey(),
    // scheduled | manual | startup
    trigger: varchar('trigger', { length: 10 }).notNull(),
    // full | incremental
    kind: varchar('kind', { length: 11 }).notNull().default('full'),
    // success | partial | failed | skipped
    status: varchar('status', { length: 10 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, precision: 3 }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true, precision: 3 }).notNull(),
    imported: integer('imported').notNull(),
    updated: integer('updated').notNull(),
    identical: integer('identical').notNull(),
    kept: integer('kept').notNull(),
    absent: integer('absent').notNull(),
    ignored: integer('ignored').notNull(),
    errors: integer('errors').notNull(),
    // Le détail : comparaison avec la base, exhaustivité, messages d'erreur.
    report: jsonb('report').$type<ScrapeReport>().notNull(),
  },
  (table) => [index('scrape_runs_started_at_idx').on(table.startedAt)],
);

export type ScrapeRunRow = typeof scrapeRuns.$inferSelect;
