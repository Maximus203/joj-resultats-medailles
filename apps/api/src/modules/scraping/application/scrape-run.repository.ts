import type { ScrapeKind, ScrapeRun } from '../domain/scrape-run';

/** Port : le suivi des exécutions. Implémenté par DrizzleScrapeRunRepository et un faux en mémoire. */
export abstract class ScrapeRunRepository {
  abstract add(run: ScrapeRun): Promise<void>;

  /** Les dernières exécutions, la plus récente d'abord. */
  abstract latest(limit: number): Promise<ScrapeRun[]>;

  /** Le début de la dernière exécution qui n'a ni échoué ni été sautée, ou `null`. */
  abstract lastSucceededAt(): Promise<Date | null>;

  /** Le début de la dernière exécution lancée ou sautée, de tout genre, ou `null`. */
  abstract lastAttemptAt(): Promise<Date | null>;

  /** Le début du dernier import de ce genre réellement lancé (jamais un sauté), ou `null`. */
  abstract lastStartedAt(kind: ScrapeKind): Promise<Date | null>;

  /** Le dernier import complet réellement lancé : celui qui porte la comparaison à la base. */
  abstract latestFull(): Promise<ScrapeRun | null>;
}
