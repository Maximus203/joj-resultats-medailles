import { Inject, Injectable } from '@nestjs/common';
import type { ScrapeRun } from '../../domain/scrape-run';
import { nextDailySlot } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { RunScrape } from './run-scrape';

const RECENT_RUNS = 10;

export interface ScrapeStatusView {
  settings: ScrapingSettings;
  running: boolean;
  nextRunAt: Date | null;
  lastRun: ScrapeRun | null;
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
    const recentRuns = await this.runs.latest(RECENT_RUNS);
    return {
      settings: this.settings,
      running: this.runScrape.running,
      nextRunAt: this.settings.enabled ? nextDailySlot(this.clock.now(), this.settings) : null,
      lastRun: recentRuns[0] ?? null,
      recentRuns,
    };
  }
}
