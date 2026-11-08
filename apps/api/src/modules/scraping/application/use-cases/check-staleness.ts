import { Inject, Injectable, Logger } from '@nestjs/common';
import { isStale } from '../../domain/scrape-schedule';
import { Clock } from '../clock';
import { ScrapeRunRepository } from '../scrape-run.repository';
import { SCRAPING_SETTINGS, type ScrapingSettings } from '../scraping-settings';

/**
 * Surveille la fraîcheur des données : appelé à chaque battement, il journalise un avertissement
 * au passage à « périmé », une seule fois par épisode, et note le retour à jour.
 */
@Injectable()
export class CheckStaleness {
  private readonly logger = new Logger(CheckStaleness.name);
  private stale = false;

  constructor(
    private readonly runs: ScrapeRunRepository,
    private readonly clock: Clock,
    @Inject(SCRAPING_SETTINGS) private readonly settings: ScrapingSettings,
  ) {}

  async execute(): Promise<boolean> {
    const lastSucceededAt = await this.runs.lastSucceededAt();
    const stale =
      this.settings.enabled && isStale({ now: this.clock.now(), lastSucceededAt }, this.settings);
    if (stale && !this.stale) {
      const since = lastSucceededAt
        ? `depuis ${lastSucceededAt.toISOString()}`
        : 'depuis le démarrage';
      this.logger.warn(
        `Données périmées : aucun import réussi ${since} (seuil ${this.settings.staleAfterMinutes} min)`,
      );
    } else if (!stale && this.stale) {
      this.logger.log('Données de nouveau à jour');
    }
    this.stale = stale;
    return stale;
  }
}
