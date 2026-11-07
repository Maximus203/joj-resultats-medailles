// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { sql } from 'drizzle-orm';
import { check, date, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const PODIUMS_EVENT_KEY_UNIQUE = 'podiums_event_key_key';

export const podiums = pgTable(
  'podiums',
  {
    id: uuid('id').primaryKey(),
    eventName: varchar('event_name', { length: 100 }).notNull(),
    // Le nom en minuscules, calculé par le domaine (Podium.eventKey) : une épreuve, un podium.
    eventKey: varchar('event_key', { length: 100 }).notNull(),
    discipline: varchar('discipline', { length: 100 }).notNull(),
    // Un jour sans heure, au format AAAA-MM-JJ.
    day: date('day', { mode: 'string' }).notNull(),
    gold: varchar('gold', { length: 3 }).notNull(),
    silver: varchar('silver', { length: 3 }).notNull(),
    bronze: varchar('bronze', { length: 3 }).notNull(),
    // Précision milliseconde = celle de Date en JavaScript.
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
    // La dernière correction ; nul tant que le podium n'a jamais été corrigé.
    correctedAt: timestamp('corrected_at', { withTimezone: true, precision: 3 }),
  },
  (table) => [
    uniqueIndex(PODIUMS_EVENT_KEY_UNIQUE).on(table.eventKey),
    check(
      'podiums_countries_distinct',
      sql`${table.gold} <> ${table.silver} and ${table.gold} <> ${table.bronze} and ${table.silver} <> ${table.bronze}`,
    ),
  ],
);

export type PodiumRow = typeof podiums.$inferSelect;
