import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { normalizeEventKey } from '@joj/shared';
import {
  type Collection,
  collectOfficialPodiums,
  daysBetween,
} from '../../domain/official-results';
import { type StoredPodium, reconcile } from '../../domain/podium-reconciliation';
import {
  type PodiumDifference,
  type ScrapedEvent,
  type ScrapeKind,
  type ScrapeReport,
  type ScrapeRun,
  type ScrapeTrigger,
  countsOf,
  statusOf,
} from '../../domain/scrape-run';
import { localDay } from '../../domain/local-time';
import { scrapeAlreadyRunning } from '../../domain/scraping.errors';
import { Clock } from '../clock';
import { ImportedPodiumRepository } from '../imported-podium.repository';
import { ResultsSource } from '../results-source';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { ScrapeRunRepository } from '../scrape-run.repository';

/**
 * Une exécution de l'import : lit le site officiel, compare à la base, écrit ce qui est sûr, puis
 * garde le compte rendu. Une seule à la fois ; rien ne la fait lever une exception en dehors du
 * refus de la seconde : une panne devient une exécution `failed` ou `partial`, jamais un arrêt.
 */
@Injectable()
export class RunScrape {
  private readonly logger = new Logger(RunScrape.name);
  private current: Promise<ScrapeRun> | null = null;

  constructor(
    private readonly source: ResultsSource,
    private readonly podiums: ImportedPodiumRepository,
    private readonly runs: ScrapeRunRepository,
    private readonly clock: Clock,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  get running(): boolean {
    return this.current !== null;
  }

  /** Attend la fin de l'exécution en cours, s'il y en a une. */
  async whenIdle(): Promise<void> {
    await this.current?.catch(() => undefined);
  }

  /** Lance l'exécution ; lève SCRAPE_ALREADY_RUNNING tout de suite si une autre tourne. */
  execute(trigger: ScrapeTrigger, kind: ScrapeKind = 'full'): Promise<ScrapeRun> {
    if (this.current) throw scrapeAlreadyRunning();
    const run = this.perform(trigger, kind).finally(() => {
      this.current = null;
    });
    this.current = run;
    return run;
  }

  /** Trace un import sauté (un autre tournait) : aucune lecture, aucune erreur. */
  async recordSkipped(
    trigger: ScrapeTrigger,
    kind: ScrapeKind,
    reason: string,
  ): Promise<ScrapeRun> {
    const now = this.clock.now();
    const run: ScrapeRun = {
      id: randomUUID(),
      trigger,
      kind,
      status: 'skipped',
      startedAt: now,
      finishedAt: now,
      report: {
        imported: [],
        updated: [],
        kept: [],
        identical: 0,
        absentFromSource: [],
        exhaustiveness: {
          daysRead: [],
          daysFailed: [],
          finalsSeen: 0,
          finalsWithPodium: 0,
          finalsKnown: 0,
          ignored: [],
        },
        errors: [],
        skippedReason: reason,
      },
    };
    await this.remember(run);
    this.logger.log(`Import ${kind} ${trigger} sauté : ${reason}`);
    return run;
  }

  private async perform(trigger: ScrapeTrigger, kind: ScrapeKind): Promise<ScrapeRun> {
    const startedAt = this.clock.now();
    const days = this.daysToRead(startedAt, kind);
    const existing = await this.existingPodiums();
    const known = new Set((existing ?? []).map((podium) => normalizeEventKey(podium.eventName)));
    const isKnown =
      kind === 'incremental' ? (key: string) => known.has(normalizeEventKey(key)) : undefined;
    const collection = await this.collect(days, isKnown);
    const report = await this.apply(collection, startedAt, existing, kind);
    const run: ScrapeRun = {
      id: randomUUID(),
      trigger,
      kind,
      status: statusOf(report, days.length),
      startedAt,
      finishedAt: this.clock.now(),
      report,
    };
    await this.remember(run);
    this.logger.log(
      `Import ${kind} ${trigger} ${run.status} en ${run.finishedAt.getTime() - startedAt.getTime()} ms : ${JSON.stringify(countsOf(report))}, jours lus ${report.exhaustiveness.daysRead.length}/${days.length}`,
    );
    for (const error of report.errors) this.logger.warn(error);
    return run;
  }

  /** Complet : tous les jours des Jeux jusqu'à aujourd'hui ; léger : hier et aujourd'hui seulement. */
  private daysToRead(now: Date, kind: ScrapeKind): string[] {
    const today = localDay(now, this.settings.timeZone);
    const yesterday = new Date(Date.parse(today) - 86_400_000).toISOString().slice(0, 10);
    return daysBetween(this.settings.firstDay, this.settings.lastDay).filter(
      (day) => day <= today && (kind === 'full' || day >= yesterday),
    );
  }

  private async existingPodiums(): Promise<StoredPodium[] | null> {
    try {
      return await this.podiums.findAll();
    } catch (error) {
      this.logger.error(`base de données illisible : ${messageOf(error)}`);
      return null;
    }
  }

  private async collect(days: string[], isKnown?: (key: string) => boolean): Promise<Collection> {
    try {
      return await collectOfficialPodiums(this.source, days, isKnown ? { isKnown } : {});
    } catch (error) {
      this.logger.error(error);
      return {
        drafts: [],
        ignored: [],
        finalsSeen: 0,
        finalsKnown: 0,
        eventKeysSeen: [],
        daysRead: [],
        daysFailed: days,
        errors: [`lecture du site impossible (${messageOf(error)})`],
      };
    }
  }

  /** Compare la collecte à la base et écrit insertions et mises à jour, une par une. */
  private async apply(
    collection: Collection,
    now: Date,
    existing: StoredPodium[] | null,
    kind: ScrapeKind,
  ): Promise<ScrapeReport> {
    const errors = [...collection.errors];
    const imported: ScrapedEvent[] = [];
    const updated: PodiumDifference[] = [];
    if (existing === null) {
      errors.push("base de données illisible, rien n'est écrit");
      return this.report(collection, errors, {
        imported,
        updated,
        kept: [],
        identical: 0,
        absent: [],
      });
    }
    const plan = reconcile({
      existing,
      drafts: collection.drafts,
      eventKeysSeen: collection.eventKeysSeen,
      // Le léger ne confronte rien : « absent de la source » est l'affaire du complet.
      daysRead: kind === 'full' ? collection.daysRead : [],
    });
    for (const draft of plan.inserts) {
      try {
        await this.podiums.insert(draft, now);
        imported.push({ eventName: draft.eventName, day: draft.day });
      } catch (error) {
        errors.push(`${draft.eventName} : écriture impossible (${messageOf(error)})`);
      }
    }
    for (const { draft, current, difference } of plan.updates) {
      // Tout changement de médaillés, second bronze compris, garde l'ancienne version consultable.
      const revision = {
        gold: current.gold,
        silver: current.silver,
        bronze: current.bronze,
        ...(current.secondBronze ? { secondBronze: current.secondBronze } : {}),
        correctedAt: now,
      };
      try {
        await this.podiums.update(current.id, draft, revision);
        updated.push(difference);
      } catch (error) {
        errors.push(`${draft.eventName} : mise à jour impossible (${messageOf(error)})`);
      }
    }
    return this.report(collection, errors, {
      imported,
      updated,
      kept: plan.kept,
      identical: plan.identical,
      absent: plan.absent,
    });
  }

  private report(
    collection: Collection,
    errors: string[],
    outcome: {
      imported: ScrapedEvent[];
      updated: PodiumDifference[];
      kept: PodiumDifference[];
      identical: number;
      absent: ScrapedEvent[];
    },
  ): ScrapeReport {
    return {
      imported: outcome.imported,
      updated: outcome.updated,
      kept: outcome.kept,
      identical: outcome.identical,
      absentFromSource: outcome.absent,
      exhaustiveness: {
        daysRead: collection.daysRead,
        daysFailed: collection.daysFailed,
        finalsSeen: collection.finalsSeen,
        finalsWithPodium: collection.drafts.length,
        finalsKnown: collection.finalsKnown,
        ignored: collection.ignored,
      },
      errors,
    };
  }

  private async remember(run: ScrapeRun): Promise<void> {
    try {
      await this.runs.add(run);
    } catch (error) {
      this.logger.error(`Compte rendu non enregistré : ${messageOf(error)}`);
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
