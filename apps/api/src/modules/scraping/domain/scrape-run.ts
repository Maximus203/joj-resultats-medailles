import type { IgnoredFinal } from './official-results';

export type ScrapeTrigger = 'scheduled' | 'manual' | 'startup';
/** `failed` : aucun jour du calendrier lu ; `partial` : au moins une erreur ; `success` sinon. */
export type ScrapeStatus = 'success' | 'partial' | 'failed';

/** Les médaillés d'un podium, de part et d'autre d'une comparaison. */
export interface PodiumMedals {
  gold: string;
  silver: string;
  bronze: string;
  secondBronze: string | null;
}

export interface ScrapedEvent {
  eventName: string;
  day: string;
}

/** Une épreuve dont la source et la base ne disent pas la même chose. */
export interface PodiumDifference extends ScrapedEvent {
  /** `updated` : la base a pris la version de la source ; `kept` : la base a gardé la sienne. */
  outcome: 'updated' | 'kept';
  /** Pourquoi la base a gardé sa version : corrigée par le journaliste, ou saisie à la main. */
  reason: 'CORRECTED' | 'MANUAL' | null;
  current: PodiumMedals;
  source: PodiumMedals;
}

/** Ce que l'import a vu de la source : le trou ne doit jamais être silencieux. */
export interface Exhaustiveness {
  daysRead: string[];
  daysFailed: string[];
  /** Les épreuves terminées vues sur le site officiel. */
  finalsSeen: number;
  /** Celles qui ont donné un podium (importé, mis à jour, identique ou laissé tel quel). */
  finalsWithPodium: number;
  ignored: IgnoredFinal[];
}

export interface ScrapeReport {
  imported: ScrapedEvent[];
  updated: PodiumDifference[];
  kept: PodiumDifference[];
  identical: number;
  /** En base, d'un jour lu, mais que le site ne montre plus comme finale terminée. */
  absentFromSource: ScrapedEvent[];
  exhaustiveness: Exhaustiveness;
  errors: string[];
}

export interface ScrapeRun {
  id: string;
  trigger: ScrapeTrigger;
  status: ScrapeStatus;
  startedAt: Date;
  finishedAt: Date;
  report: ScrapeReport;
}

export interface ScrapeCounts {
  imported: number;
  updated: number;
  identical: number;
  kept: number;
  absent: number;
  ignored: number;
  errors: number;
}

export function countsOf(report: ScrapeReport): ScrapeCounts {
  return {
    imported: report.imported.length,
    updated: report.updated.length,
    identical: report.identical,
    kept: report.kept.length,
    absent: report.absentFromSource.length,
    ignored: report.exhaustiveness.ignored.length,
    errors: report.errors.length,
  };
}

export function statusOf(report: ScrapeReport, daysToRead: number): ScrapeStatus {
  if (daysToRead > 0 && report.exhaustiveness.daysRead.length === 0) return 'failed';
  return report.errors.length > 0 ? 'partial' : 'success';
}
