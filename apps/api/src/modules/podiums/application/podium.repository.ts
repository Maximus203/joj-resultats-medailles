import type { Podium } from '../domain/podium';
import type { PodiumRevision } from '../domain/podium-revision';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzlePodiumRepository (infra) et InMemoryPodiumRepository (tests).
 */
export abstract class PodiumRepository {
  /** Enregistre le podium ; lève PODIUM_ALREADY_RECORDED si l'épreuve en a déjà un. */
  abstract add(podium: Podium): Promise<void>;

  /** Les podiums enregistrés (ceux d'un jour si `day` est donné), dans un ordre quelconque. */
  abstract list(day?: string): Promise<Podium[]>;

  /** Le podium de cet identifiant, ou `null` s'il n'existe pas. */
  abstract findById(id: string): Promise<Podium | null>;

  /** Remplace le podium par sa version corrigée et conserve la version remplacée, ensemble. */
  abstract saveCorrection(podium: Podium, revision: PodiumRevision | null): Promise<void>;

  /** Les versions remplacées du podium, la plus récente d'abord. */
  abstract revisionsOf(id: string): Promise<PodiumRevision[]>;
}
