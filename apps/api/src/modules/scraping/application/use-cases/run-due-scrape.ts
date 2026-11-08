import { Inject, Injectable } from '@nestjs/common';
import { type ScrapeRun } from '../../domain/scrape-run';
import { dueReason } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { RunScrape } from './run-scrape';

/**
 * Appelé par l'horloge à chaque battement : lance l'import s'il est dû (heure fixe, intervalle,
 * rattrapage au démarrage), sinon ne fait rien. Rend l'exécution lancée, ou `null`.
 */
@Injectable()
export class RunDueScrape {
  constructor(
    private readonly runScrape: RunScrape,
    private readonly runs: ScrapeRunRepository,
    private readonly clock: Clock,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  async execute({ startup }: { startup: boolean }): Promise<ScrapeRun | null> {
    if (!this.settings.enabled || this.runScrape.running) return null;
    const [lastRun] = await this.runs.latest(1);
    const reason = dueReason(
      {
        now: this.clock.now(),
        lastAttemptAt: lastRun?.startedAt ?? null,
        lastSucceededAt: await this.runs.lastSucceededAt(),
        startup,
      },
      this.settings,
    );
    if (!reason) return null;
    return this.runScrape.execute(reason === 'catch-up' ? 'startup' : 'scheduled');
  }
}
