import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type Collection,
  collectOfficialPodiums,
  daysBetween,
} from '../../domain/official-results';
import { type StoredPodium, reconcile } from '../../domain/podium-reconciliation';
import {
  type PodiumDifference,
  type ScrapedEvent,
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
  execute(trigger: ScrapeTrigger): Promise<ScrapeRun> {
    if (this.current) throw scrapeAlreadyRunning();
    const run = this.perform(trigger).finally(() => {
      this.current = null;
    });
    this.current = run;
    return run;
  }

  private async perform(trigger: ScrapeTrigger): Promise<ScrapeRun> {
    const startedAt = this.clock.now();
    const days = daysBetween(this.settings.firstDay, this.settings.lastDay).filter(
      (day) => day <= localDay(startedAt, this.settings.timeZone),
    );
    const collection = await this.collect(days);
    const report = await this.apply(collection, startedAt);
    const run: ScrapeRun = {
      id: randomUUID(),
      trigger,
      status: statusOf(report, days.length),
      startedAt,
      finishedAt: this.clock.now(),
      report,
    };
    await this.remember(run);
    this.logger.log(
      `Import ${trigger} ${run.status} : ${JSON.stringify(countsOf(report))}, jours lus ${report.exhaustiveness.daysRead.length}/${days.length}`,
    );
    for (const error of report.errors) this.logger.warn(error);
    return run;
  }

  private async collect(days: string[]): Promise<Collection> {
    try {
      return await collectOfficialPodiums(this.source, days);
    } catch (error) {
      this.logger.error(error);
      return {
        drafts: [],
        ignored: [],
        finalsSeen: 0,
        eventKeysSeen: [],
        daysRead: [],
        daysFailed: days,
        errors: [`lecture du site impossible (${messageOf(error)})`],
      };
    }
  }

  /** Compare la collecte à la base et écrit insertions et mises à jour, une par une. */
  private async apply(collection: Collection, now: Date): Promise<ScrapeReport> {
    const errors = [...collection.errors];
    const imported: ScrapedEvent[] = [];
    const updated: PodiumDifference[] = [];
    let existing: StoredPodium[] = [];
    try {
      existing = await this.podiums.findAll();
    } catch (error) {
      errors.push(`base de données illisible, rien n'est écrit (${messageOf(error)})`);
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
      daysRead: collection.daysRead,
    });
    for (const draft of plan.inserts) {
      try {
        await this.podiums.insert(draft, now);
        imported.push({ eventName: draft.eventName, day: draft.day });
      } catch (error) {
        errors.push(`${draft.eventName} : écriture impossible (${messageOf(error)})`);
      }
    }
    for (const { draft, current, difference, replacesPlaces } of plan.updates) {
      const revision = replacesPlaces
        ? { gold: current.gold, silver: current.silver, bronze: current.bronze, correctedAt: now }
        : null;
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
