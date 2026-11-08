import { Inject, Injectable } from '@nestjs/common';
import { type ScrapeRun } from '../../domain/scrape-run';
import { dueRun } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';
import { RunScrape } from './run-scrape';

/**
 * Appelé par l'horloge à chaque battement : lance l'import dû (complet à heure fixe, léger à
 * intervalle, rattrapage complet au démarrage), sinon ne fait rien. Rend l'exécution lancée ou
 * sautée, ou `null`.
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
    if (!this.settings.enabled) return null;
    const [lastAttemptAt, lastFullAt, lastSucceededAt] = await Promise.all([
      this.runs.lastAttemptAt(),
      this.runs.lastStartedAt('full'),
      this.runs.lastSucceededAt(),
    ]);
    const due = dueRun(
      { now: this.clock.now(), lastAttemptAt, lastFullAt, lastSucceededAt, startup },
      this.settings,
    );
    if (!due) return null;
    const trigger = due.reason === 'catch-up' ? 'startup' : 'scheduled';
    // Jamais deux imports à la fois : un import dû pendant un autre est sauté, et le suivi le dit.
    if (this.runScrape.running) {
      return this.runScrape.recordSkipped(trigger, due.kind, 'un autre import est en cours');
    }
    return this.runScrape.execute(trigger, due.kind);
  }
}
