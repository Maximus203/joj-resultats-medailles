const UNIQUE_VIOLATION = '23505';

interface PgError {
  code: string;
  constraint?: string;
}

/**
 * Vrai si l'erreur vient d'une contrainte d'unicité. Drizzle enveloppe l'erreur du driver
 * (pg ou PGlite) : on remonte la chaîne `cause` jusqu'à l'erreur Postgres.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('code' in current && typeof current.code === 'string') {
      const pgError = current as Error & PgError;
      return pgError.code === UNIQUE_VIOLATION && pgError.constraint === constraint;
    }
  }
  return false;
}
