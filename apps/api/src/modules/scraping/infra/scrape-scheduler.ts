import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../application/scraping-settings';
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
    private readonly runDue: RunDueScrape,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.settings.enabled) {
      this.logger.log('Import automatique désactivé (SCRAPING_ENABLED)');
      return;
    }
    this.logger.log(
      `Import automatique actif : ${this.settings.dailyTime} (${this.settings.timeZone}), du ${this.settings.firstDay} au ${this.settings.lastDay}`,
    );
    void this.tick(true);
    this.timer = setInterval(() => void this.tick(false), this.settings.tickSeconds * 1000);
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(startup: boolean): Promise<void> {
    try {
      await this.runDue.execute({ startup });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
