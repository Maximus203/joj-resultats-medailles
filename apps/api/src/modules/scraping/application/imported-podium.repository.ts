import type { PodiumRevision } from '../../podiums/domain/podium-revision';
import type { PodiumDraft } from '../domain/official-results';
import type { StoredPodium } from '../domain/podium-reconciliation';

/**
 * Port : les podiums de la base, vus par l'import. Implémenté par DrizzleImportedPodiumRepository
 * (infra) et InMemoryImportedPodiumRepository (tests).
 */
export abstract class ImportedPodiumRepository {
  abstract findAll(): Promise<StoredPodium[]>;

  /** Insère le podium de la source avec son identifiant stable. */
  abstract insert(draft: PodiumDraft, now: Date): Promise<void>;

  /** Remplace les médaillés du podium et garde la version remplacée, ensemble. */
  abstract update(id: string, draft: PodiumDraft, revision: PodiumRevision): Promise<void>;
}
