/**
 * Variables d'environnement de l'API et leurs valeurs par défaut : l'unique endroit. Fichier sans
 * import relatif ni syntaxe réservée à la compilation, pour que les scripts Node (`db:scrape`) le lisent.
 */
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Défini : un vrai serveur PostgreSQL. Absent : PGlite, embarqué dans le process. */
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
  /** Dossier des données PGlite, relatif à apps/api ; `memory://` pour une base en mémoire. */
  PGLITE_DATA_DIR: z.string().min(1).default('.data/pglite'),

  /** Import automatique des résultats officiels (module scraping). Éteint tant qu'on ne l'allume pas. */
  SCRAPING_ENABLED: z.stringbool().default(false),
  /** Racine des pages du site officiel des résultats. */
  SCRAPING_SOURCE_URL: z.url().default('https://webresult.apps.dakar2026.org/nh/en/Comp'),
  /** Premier et dernier jour des Jeux (AAAA-MM-JJ) : l'import ne lit rien en dehors. */
  SCRAPING_FIRST_DAY: z.iso.date().default('2026-11-01'),
  SCRAPING_LAST_DAY: z.iso.date().default('2026-11-13'),
  /** Heure locale (HH:MM) de l'exécution quotidienne, dans SCRAPING_TIMEZONE. */
  SCRAPING_DAILY_TIME: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .default('23:00'),
  SCRAPING_TIMEZONE: z
    .string()
    .refine(isTimeZone, 'fuseau horaire IANA inconnu')
    .default('Africa/Dakar'),
  /** En plus de l'heure fixe : une exécution toutes les N minutes pendant les Jeux (facultatif). */
  SCRAPING_INTERVAL_MINUTES: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  /** Fréquence à laquelle l'horloge regarde si une exécution est due. */
  SCRAPING_TICK_SECONDS: z.coerce.number().int().positive().default(60),
  /** Politesse envers le site officiel : pause après chaque requête, délai maximal d'une requête. */
  SCRAPING_REQUEST_DELAY_MS: z.coerce.number().int().min(0).default(250),
  SCRAPING_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  SCRAPING_USER_AGENT: z.string().min(1).default('joj-bootcamp-scraper/0.1 (projet pédagogique)'),
});

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type Env = z.infer<typeof envSchema>;
