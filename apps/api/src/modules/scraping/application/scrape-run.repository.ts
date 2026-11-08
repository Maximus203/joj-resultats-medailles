import type { ScrapeRun } from '../domain/scrape-run';

/** Port : le suivi des exécutions. Implémenté par DrizzleScrapeRunRepository et un faux en mémoire. */
export abstract class ScrapeRunRepository {
  abstract add(run: ScrapeRun): Promise<void>;

  /** Les dernières exécutions, la plus récente d'abord. */
  abstract latest(limit: number): Promise<ScrapeRun[]>;

  /** Le début de la dernière exécution qui n'a pas échoué, ou `null`. */
  abstract lastSucceededAt(): Promise<Date | null>;
}
