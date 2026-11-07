// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

export const DISCIPLINES_NAME_KEY = 'disciplines_name_key';

export const disciplines = pgTable(
  'disciplines',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    // La liste des catégories est vérifiée par le domaine (DISCIPLINE_CATEGORIES).
    category: varchar('category', { length: 50 }).notNull(),
    // Précision milliseconde = celle de Date en JavaScript.
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [uniqueIndex(DISCIPLINES_NAME_KEY).on(table.name)],
);

export type DisciplineRow = typeof disciplines.$inferSelect;
