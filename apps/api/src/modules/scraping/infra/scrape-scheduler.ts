import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../application/scraping-settings';
import { CheckStaleness } from '../application/use-cases/check-staleness';
import { RunDueScrape } from '../application/use-cases/run-due-scrape';

/**
 * L'horloge de l'import : un battement toutes les `tickSeconds` secondes demande au cas d'usage
 * s'il y a quelque chose à faire. Au démarrage, un premier battement rattrape une exécution
 * manquée. Éteinte (par défaut), elle ne démarre rien.
 */
@Injectable()
export class ScrapeScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ScrapeScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(RunDueScrape) private readonly runDue: Pick<RunDueScrape, 'execute'>,
    @Inject(CheckStaleness) private readonly staleness: Pick<CheckStaleness, 'execute'>,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.settings.enabled) {
      this.logger.log('Import automatique désactivé (SCRAPING_ENABLED)');
      return;
    }
    this.logger.log(
      `Import automatique actif : complet à ${this.settings.fullTimes.join(', ')}, léger toutes les ${this.settings.intervalMinutes} min de ${this.settings.windowStart} à ${this.settings.windowEnd} (${this.settings.timeZone}), du ${this.settings.firstDay} au ${this.settings.lastDay}`,
    );
    void this.tick(true);
    void this.watchStaleness();
    this.timer = setInterval(() => {
      void this.tick(false);
      void this.watchStaleness();
    }, this.settings.tickSeconds * 1000);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Chaque battement demande à RunDueScrape ce qui est dû : le garde de chevauchement est celui de
   * RunScrape, qui trace « sauté » l'import léger tombé pendant un autre et retient le créneau complet.
   */
  private async tick(startup: boolean): Promise<void> {
    try {
      await this.runDue.execute({ startup });
    } catch (error) {
      this.logger.error(error);
    }
  }

  /** La fraîcheur se surveille à chaque battement, même pendant un import long. */
  private async watchStaleness(): Promise<void> {
    try {
      await this.staleness.execute();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
