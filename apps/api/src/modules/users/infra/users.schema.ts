// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { check, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const USERS_EMAIL_UNIQUE = 'users_email_key';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    // En minuscules : deux écritures d'une même adresse sont le même compte.
    email: varchar('email', { length: 254 }).notNull(),
    // journalist enregistre les podiums, supporter les consulte.
    role: varchar('role', { length: 20 }).notNull(),
    // Jamais le mot de passe : son empreinte (voir core/security/password-hash.ts).
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex(USERS_EMAIL_UNIQUE).on(table.email),
    check('users_role_known', sql`${table.role} in ('journalist', 'supporter')`),
  ],
);

export type UserRow = typeof users.$inferSelect;
