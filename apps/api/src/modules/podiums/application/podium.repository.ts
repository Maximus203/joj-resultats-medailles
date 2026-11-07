import type { Podium } from '../domain/podium';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzlePodiumRepository (infra) et InMemoryPodiumRepository (tests).
 */
export abstract class PodiumRepository {
  /** Enregistre le podium ; lève PODIUM_ALREADY_RECORDED si l'épreuve en a déjà un. */
  abstract add(podium: Podium): Promise<void>;

  /** Tous les podiums enregistrés, dans un ordre quelconque. */
  abstract list(): Promise<Podium[]>;
}
