import type { Podium } from '../../domain/podium';
import type { PodiumRevision } from '../../domain/podium-revision';
import { podiumAlreadyRecorded } from '../../domain/podiums.errors';
import { PodiumRepository } from '../podium.repository';

/** Fake fidèle au contrat du port (un seul podium par épreuve), pour tester sans base. */
export class InMemoryPodiumRepository extends PodiumRepository {
  private readonly rows = new Map<string, Podium>();
  private readonly revisions = new Map<string, PodiumRevision[]>();

  async add(podium: Podium): Promise<void> {
    if (this.rows.has(podium.eventKey)) throw podiumAlreadyRecorded(podium.eventName);
    this.rows.set(podium.eventKey, podium);
  }

  async list(day?: string): Promise<Podium[]> {
    return this.all().filter((podium) => day === undefined || podium.day === day);
  }

  async findById(id: string): Promise<Podium | null> {
    return this.all().find((podium) => podium.id === id) ?? null;
  }

  async saveCorrection(podium: Podium, revision: PodiumRevision | null): Promise<void> {
    this.rows.set(podium.eventKey, podium);
    if (revision)
      this.revisions.set(podium.id, [revision, ...(this.revisions.get(podium.id) ?? [])]);
  }

  async revisionsOf(id: string): Promise<PodiumRevision[]> {
    return this.revisions.get(id) ?? [];
  }

  /** Les podiums enregistrés : sert aux tests à vérifier ce qui a été conservé. */
  all(): readonly Podium[] {
    return [...this.rows.values()];
  }
}
