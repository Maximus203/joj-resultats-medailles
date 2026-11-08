import { Injectable, Logger } from '@nestjs/common';
import { RunScrape } from './run-scrape';

/** Lance une exécution à la demande sans l'attendre : son résultat se lit dans l'état de l'import. */
@Injectable()
export class StartScrape {
  private readonly logger = new Logger(StartScrape.name);

  constructor(private readonly runScrape: RunScrape) {}

  /** Lève SCRAPE_ALREADY_RUNNING si une exécution tourne déjà. */
  execute(): void {
    this.runScrape.execute('manual').catch((error: unknown) => this.logger.error(error));
  }
}
