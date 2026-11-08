import type { PodiumRevision } from '../../../podiums/domain/podium-revision';
import type { PodiumDraft } from '../../domain/official-results';
import type { StoredPodium } from '../../domain/podium-reconciliation';
import { ImportedPodiumRepository } from '../imported-podium.repository';

/** Fake fidèle au contrat du port, pour tester sans base. */
export class InMemoryImportedPodiumRepository extends ImportedPodiumRepository {
  private readonly rows = new Map<string, StoredPodium>();
  readonly revisions: { podiumId: string; revision: PodiumRevision }[] = [];

  constructor(initial: readonly StoredPodium[] = []) {
    super();
    for (const podium of initial) this.rows.set(podium.eventKey, podium);
  }

  async findAll(): Promise<StoredPodium[]> {
    return [...this.rows.values()];
  }

  async insert(draft: PodiumDraft): Promise<void> {
    if (this.rows.has(draft.eventKey)) throw new Error(`doublon ${draft.eventKey}`);
    this.rows.set(draft.eventKey, { ...draft, correctedAt: null });
  }

  async update(id: string, draft: PodiumDraft, revision: PodiumRevision | null): Promise<void> {
    const current = [...this.rows.values()].find((podium) => podium.id === id);
    if (!current) throw new Error(`podium inconnu ${id}`);
    this.rows.set(current.eventKey, {
      ...current,
      gold: draft.gold,
      silver: draft.silver,
      bronze: draft.bronze,
      secondBronze: draft.secondBronze,
    });
    if (revision) this.revisions.push({ podiumId: id, revision });
  }
}
