import { z } from 'zod';
import { countryCodeSchema } from './podiums.ts';

/**
 * Contrat de l'import automatique des résultats officiels (spec 007) : l'état et le compte rendu
 * de la dernière exécution. L'API et un éventuel écran se branchent sur ces schémas.
 */

export const scrapeTriggerSchema = z.enum(['scheduled', 'manual', 'startup']);
/** `failed` : aucun jour du calendrier lu ; `partial` : au moins une erreur ; `skipped` : sauté, un autre import tournait ; `success` sinon. */
export const scrapeStatusValueSchema = z.enum(['success', 'partial', 'failed', 'skipped']);

const podiumMedalsSchema = z.object({
  gold: countryCodeSchema,
  silver: countryCodeSchema,
  bronze: countryCodeSchema,
  secondBronze: countryCodeSchema.nullable(),
});

const scrapedEventSchema = z.object({ eventName: z.string(), day: z.iso.date() });

/** Une épreuve dont la source diffère de la base, avec l'ancien (`current`) et le nouveau (`source`) podium. */
export const podiumDifferenceSchema = scrapedEventSchema.extend({
  /** `updated` : la base a pris la version de la source ; `kept` : elle a gardé la sienne. */
  outcome: z.enum(['updated', 'kept']),
  /** Pourquoi la base a gardé sa version : corrigée par le journaliste, ou saisie à la main. */
  reason: z.enum(['CORRECTED', 'MANUAL']).nullable(),
  current: podiumMedalsSchema,
  source: podiumMedalsSchema,
});
export type PodiumDifferenceResponse = z.infer<typeof podiumDifferenceSchema>;

export const ignoredFinalSchema = z.object({
  day: z.iso.date(),
  discipline: z.string(),
  competition: z.string(),
  /** Code de l'unité sur le site officiel. */
  code: z.string(),
  reason: z.enum([
    'NO_MEDALS',
    'INCOMPLETE_PODIUM',
    'TIED_PLACES',
    'TOO_MANY_BRONZE',
    'SAME_COUNTRY',
    'FETCH_FAILED',
  ]),
  detail: z.string(),
});

export const exhaustivenessSchema = z.object({
  daysRead: z.array(z.iso.date()),
  daysFailed: z.array(z.iso.date()),
  /** Épreuves terminées vues sur le site officiel. */
  finalsSeen: z.number().int().min(0),
  /** Celles qui ont donné un podium. */
  finalsWithPodium: z.number().int().min(0),
  /** Celles déjà en base, que l'import léger n'a pas rouvertes. */
  finalsKnown: z.number().int().min(0),
  ignored: z.array(ignoredFinalSchema),
});

export const scrapeReportSchema = z.object({
  imported: z.array(scrapedEventSchema),
  updated: z.array(podiumDifferenceSchema),
  kept: z.array(podiumDifferenceSchema),
  identical: z.number().int().min(0),
  /** En base, d'un jour lu, mais absentes du site officiel. */
  absentFromSource: z.array(scrapedEventSchema),
  exhaustiveness: exhaustivenessSchema,
  errors: z.array(z.string()),
  /** Pourquoi l'exécution a été sautée ; absent sinon. */
  skippedReason: z.string().optional(),
});

export const scrapeCountsSchema = z.object({
  imported: z.number().int().min(0),
  updated: z.number().int().min(0),
  identical: z.number().int().min(0),
  kept: z.number().int().min(0),
  absent: z.number().int().min(0),
  ignored: z.number().int().min(0),
  errors: z.number().int().min(0),
});

export const scrapeRunSummarySchema = z.object({
  id: z.uuid(),
  trigger: scrapeTriggerSchema,
  /** `full` : tous les jours et la confrontation à la base ; `incremental` : hier et aujourd'hui, finales nouvelles seulement. */
  kind: z.enum(['full', 'incremental']),
  status: scrapeStatusValueSchema,
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime(),
  durationMs: z.number().int().min(0),
  counts: scrapeCountsSchema,
  /** Pourquoi l'exécution a été sautée ; absent sinon. Servi aussi dans la liste des dernières exécutions. */
  skippedReason: z.string().optional(),
});
export type ScrapeRunSummary = z.infer<typeof scrapeRunSummarySchema>;

export const scrapeRunSchema = scrapeRunSummarySchema.extend({ report: scrapeReportSchema });
export type ScrapeRunResponse = z.infer<typeof scrapeRunSchema>;

/** `GET /api/scraping` : l'import est-il actif, quand repart-il, et ce que la dernière exécution a fait. */
export const scrapeStatusSchema = z.object({
  enabled: z.boolean(),
  running: z.boolean(),
  schedule: z.object({
    timeZone: z.string(),
    /** Heures locales des imports complets. */
    fullTimes: z.array(z.string()),
    /** Fenêtre locale des imports légers, et leur cadence en minutes. */
    windowStart: z.string(),
    windowEnd: z.string(),
    intervalMinutes: z.number().int().positive(),
    staleAfterMinutes: z.number().int().positive(),
    firstDay: z.iso.date(),
    lastDay: z.iso.date(),
  }),
  /** Le prochain import complet ; `null` si l'import est éteint ou les Jeux finis. */
  nextFullRunAt: z.iso.datetime().nullable(),
  /** Le début du dernier import réussi (ni échoué ni sauté). */
  lastSuccessAt: z.iso.datetime().nullable(),
  /** Vrai si, dans la fenêtre des Jeux, aucun import n'a réussi depuis le seuil configuré. */
  stale: z.boolean(),
  /** La dernière exécution réellement lancée, de tout genre. */
  lastRun: scrapeRunSchema.nullable(),
  /** Le dernier import complet : celui qui porte la comparaison à la base. */
  lastFullRun: scrapeRunSchema.nullable(),
  /** Les dernières exécutions, la plus récente d'abord, sans leur détail. */
  recentRuns: z.array(scrapeRunSummarySchema),
});
export type ScrapeStatus = z.infer<typeof scrapeStatusSchema>;

/** `POST /api/scraping/runs` : l'exécution est lancée, son résultat se lit sur `GET /api/scraping`. */
export const startScrapeResponseSchema = z.object({ status: z.literal('started') });
export type StartScrapeResponse = z.infer<typeof startScrapeResponseSchema>;

/*
 * Erreurs (RFC 9457, champ `code`) :
 *   POST /api/scraping/runs  409 SCRAPE_ALREADY_RUNNING
 */
