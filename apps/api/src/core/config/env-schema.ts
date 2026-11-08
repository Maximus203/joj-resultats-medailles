/**
 * Variables d'environnement de l'API et leurs valeurs par défaut : l'unique endroit. Fichier sans
 * import relatif ni syntaxe réservée à la compilation, pour que les scripts Node (`db:scrape`) le lisent.
 */
import { z } from 'zod';

const NOT_POSITIVE_INT = 'doit être un entier positif';
/** Au-delà, Node ramène le minuteur à 1 ms, et un créneau complet (2 battements de tolérance) serait trop flou. */
const MAX_TICK_SECONDS = 300;
const TICK_RANGE = `doit être un entier entre 1 et ${MAX_TICK_SECONDS} (secondes)`;
const NOT_COUNT = 'doit être un entier supérieur ou égal à 0';
const positiveInt = () =>
  z.coerce.number({ error: NOT_POSITIVE_INT }).int(NOT_POSITIVE_INT).positive(NOT_POSITIVE_INT);

const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;
const hourMinute = () =>
  z
    .string()
    .regex(HOUR_MINUTE, 'doit être une heure HH:MM entre 00:00 et 23:59 (par exemple 23:00)');

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
  /** Heures locales (HH:MM, séparées par des virgules) des imports complets, dans SCRAPING_TIMEZONE. */
  SCRAPING_FULL_TIMES: z
    .string()
    .default('07:00,23:00')
    .transform((value) => value.split(',').map((time) => time.trim()))
    .pipe(z.array(hourMinute()).min(1, 'doit contenir au moins une heure HH:MM')),
  /** Fenêtre du jour (heure locale, fin incluse à la minute) où tournent les imports légers. */
  SCRAPING_WINDOW_START: hourMinute().default('08:00'),
  SCRAPING_WINDOW_END: hourMinute().default('23:00'),
  SCRAPING_TIMEZONE: z
    .string()
    .refine(isTimeZone, 'fuseau horaire inconnu (par exemple Africa/Dakar)')
    .default('Africa/Dakar'),
  /** Cadence des imports légers pendant la fenêtre, en minutes. */
  SCRAPING_INTERVAL_MINUTES: z.preprocess(
    (value) => (value === '' ? undefined : value),
    positiveInt().default(15),
  ),
  /** Sans import réussi depuis ce nombre de minutes, dans la fenêtre, les données sont périmées. */
  SCRAPING_STALE_AFTER_MINUTES: positiveInt().default(120),
  /** Fréquence à laquelle l'horloge regarde si une exécution est due. */
  SCRAPING_TICK_SECONDS: positiveInt().max(MAX_TICK_SECONDS, TICK_RANGE).default(60),
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
export const envSchema = baseSchema
  .refine((env) => env.SCRAPING_FIRST_DAY <= env.SCRAPING_LAST_DAY, {
    path: ['SCRAPING_FIRST_DAY'],
    error: 'doit être le même jour que SCRAPING_LAST_DAY ou un jour avant',
  })
  .refine((env) => env.SCRAPING_STALE_AFTER_MINUTES > env.SCRAPING_INTERVAL_MINUTES, {
    path: ['SCRAPING_STALE_AFTER_MINUTES'],
    error:
      'doit être supérieur à SCRAPING_INTERVAL_MINUTES, sinon les données seraient « en retard » entre deux imports légers',
  })
  .refine((env) => env.SCRAPING_WINDOW_START < env.SCRAPING_WINDOW_END, {
    path: ['SCRAPING_WINDOW_START'],
    error: 'doit être avant SCRAPING_WINDOW_END',
  });

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Réglages retirés, avec ce qui les remplace : présents dans l'environnement, ils seraient ignorés sans un mot. */
export const REMOVED_SETTINGS: Readonly<Record<string, string>> = {
  SCRAPING_DAILY_TIME: 'SCRAPING_FULL_TIMES',
};

export type Env = z.infer<typeof envSchema>;
