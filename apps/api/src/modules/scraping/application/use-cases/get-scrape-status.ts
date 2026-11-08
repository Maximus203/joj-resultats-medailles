import { Inject, Injectable } from '@nestjs/common';
import type { ScrapeRun } from '../../domain/scrape-run';
import { isStale, nextFullSlot } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { RunScrape } from './run-scrape';

const RECENT_RUNS = 10;

export interface ScrapeStatusView {
  settings: ScrapingSettings;
  running: boolean;
  nextFullRunAt: Date | null;
  lastSuccessAt: Date | null;
  stale: boolean;
  lastRun: ScrapeRun | null;
  lastFullRun: ScrapeRun | null;
  recentRuns: ScrapeRun[];
}

@Injectable()
export class GetScrapeStatus {
  constructor(
    private readonly runScrape: RunScrape,
    private readonly runs: ScrapeRunRepository,
    private readonly clock: Clock,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  async execute(): Promise<ScrapeStatusView> {
    const now = this.clock.now();
    const [recentRuns, lastSuccessAt, lastFullRun] = await Promise.all([
      this.runs.latest(RECENT_RUNS),
      this.runs.lastSucceededAt(),
      this.runs.latestFull(),
    ]);
    return {
      settings: this.settings,
      running: this.runScrape.running,
      nextFullRunAt: this.settings.enabled ? nextFullSlot(now, this.settings) : null,
      lastSuccessAt,
      stale:
        this.settings.enabled && isStale({ now, lastSucceededAt: lastSuccessAt }, this.settings),
      // Une exécution sautée n'a rien lu : le dernier compte rendu utile est la dernière vraie exécution.
      lastRun: recentRuns.find((run) => run.status !== 'skipped') ?? null,
      lastFullRun,
      recentRuns,
    };
  }
}
