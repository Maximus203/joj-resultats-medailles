import type { Podium } from '../../domain/podium';
import { podiumAlreadyRecorded } from '../../domain/podiums.errors';
import { PodiumRepository } from '../podium.repository';

/** Fake fidèle au contrat du port (un seul podium par épreuve), pour tester sans base. */
export class InMemoryPodiumRepository extends PodiumRepository {
  private readonly rows = new Map<string, Podium>();

  async add(podium: Podium): Promise<void> {
    if (this.rows.has(podium.eventKey)) throw podiumAlreadyRecorded(podium.eventName);
    this.rows.set(podium.eventKey, podium);
  }

  /** Les podiums enregistrés : sert aux tests à vérifier ce qui a été conservé. */
  all(): readonly Podium[] {
    return [...this.rows.values()];
  }
}
