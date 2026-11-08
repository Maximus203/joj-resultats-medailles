/**
 * Variables d'environnement de l'API et leurs valeurs par défaut : l'unique endroit. Fichier sans
 * import relatif ni syntaxe réservée à la compilation, pour que les scripts Node (`db:scrape`) le lisent.
 */
import { z } from 'zod';

const NOT_POSITIVE_INT = 'doit être un entier positif';
const NOT_COUNT = 'doit être un entier supérieur ou égal à 0';
const positiveInt = () =>
  z.coerce.number({ error: NOT_POSITIVE_INT }).int(NOT_POSITIVE_INT).positive(NOT_POSITIVE_INT);

const baseSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'], {
      error: 'doit valoir development, test ou production',
    })
    .default('development'),
  PORT: positiveInt().default(3000),
  /** Défini : un vrai serveur PostgreSQL. Absent : PGlite, embarqué dans le process. */
  DATABASE_URL: z
    .url({
      protocol: /^postgres(ql)?$/,
      error: 'doit être une URL PostgreSQL (postgres://utilisateur:motdepasse@hôte:5432/base)',
    })
    .optional(),
  /** Dossier des données PGlite, relatif à apps/api ; `memory://` pour une base en mémoire. */
  PGLITE_DATA_DIR: z.string().min(1, 'ne doit pas être vide').default('.data/pglite'),

  /** Import automatique des résultats officiels (module scraping). Éteint tant qu'on ne l'allume pas. */
  SCRAPING_ENABLED: z.stringbool({ error: 'doit valoir true ou false' }).default(false),
  /** Racine des pages du site officiel des résultats. */
  SCRAPING_SOURCE_URL: z
    .url({ error: 'doit être une URL complète (https://…)' })
    .default('https://webresult.apps.dakar2026.org/nh/en/Comp'),
  /** Premier et dernier jour des Jeux (AAAA-MM-JJ) : l'import ne lit rien en dehors. */
  SCRAPING_FIRST_DAY: z.iso
    .date({ error: 'doit être une date au format AAAA-MM-JJ' })
    .default('2026-11-01'),
  SCRAPING_LAST_DAY: z.iso
    .date({ error: 'doit être une date au format AAAA-MM-JJ' })
    .default('2026-11-13'),
  /** Heure locale (HH:MM) de l'exécution quotidienne, dans SCRAPING_TIMEZONE. */
  SCRAPING_DAILY_TIME: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      'doit être une heure HH:MM entre 00:00 et 23:59 (par exemple 23:00)',
    )
    .default('23:00'),
  SCRAPING_TIMEZONE: z
    .string()
    .refine(isTimeZone, 'fuseau horaire inconnu (par exemple Africa/Dakar)')
    .default('Africa/Dakar'),
  /** En plus de l'heure fixe : une exécution toutes les N minutes pendant les Jeux (facultatif). */
  SCRAPING_INTERVAL_MINUTES: z.preprocess(
    (value) => (value === '' ? undefined : value),
    positiveInt().optional(),
  ),
  /** Fréquence à laquelle l'horloge regarde si une exécution est due. */
  SCRAPING_TICK_SECONDS: positiveInt().default(60),
  /** Politesse envers le site officiel : pause après chaque requête, délai maximal d'une requête. */
  SCRAPING_REQUEST_DELAY_MS: z.coerce
    .number({ error: NOT_COUNT })
    .int(NOT_COUNT)
    .min(0, NOT_COUNT)
    .default(250),
  SCRAPING_REQUEST_TIMEOUT_MS: positiveInt().default(30_000),
  SCRAPING_USER_AGENT: z
    .string()
    .min(1, 'ne doit pas être vide')
    .default('joj-bootcamp-scraper/0.1 (projet pédagogique)'),
});

/** Les règles entre variables : une plage de jours à l'envers arrête le démarrage. */
export const envSchema = baseSchema.refine(
  (env) => env.SCRAPING_FIRST_DAY <= env.SCRAPING_LAST_DAY,
  {
    path: ['SCRAPING_FIRST_DAY'],
    error: 'doit être le même jour que SCRAPING_LAST_DAY ou un jour avant',
  },
);

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type Env = z.infer<typeof envSchema>;
