import { eq } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { podiumRevisions, podiums } from '../../podiums/infra/podiums.schema';
import type { PodiumRevision } from '../../podiums/domain/podium-revision';
import { ImportedPodiumRepository } from '../application/imported-podium.repository';
import type { PodiumDraft } from '../domain/official-results';
import type { StoredPodium } from '../domain/podium-reconciliation';

/** Écrit dans la table `podiums` du module podiums : l'import et la saisie partagent la même table. */
@Injectable()
export class DrizzleImportedPodiumRepository extends ImportedPodiumRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findAll(): Promise<StoredPodium[]> {
    const rows = await this.db.select().from(podiums);
    return rows.map((row) => ({
      id: row.id,
      eventKey: row.eventKey,
      eventName: row.eventName,
      day: row.day,
      gold: row.gold,
      silver: row.silver,
      bronze: row.bronze,
      secondBronze: row.secondBronze,
      correctedAt: row.correctedAt,
    }));
  }

  async insert(draft: PodiumDraft, now: Date): Promise<void> {
    await this.db.insert(podiums).values({
      id: draft.id,
      eventName: draft.eventName,
      eventKey: draft.eventKey,
      discipline: draft.discipline,
      day: draft.day,
      gold: draft.gold,
      silver: draft.silver,
      bronze: draft.bronze,
      secondBronze: draft.secondBronze,
      createdAt: now,
    });
  }

  async update(id: string, draft: PodiumDraft, revision: PodiumRevision | null): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(podiums)
        .set({
          gold: draft.gold,
          silver: draft.silver,
          bronze: draft.bronze,
          secondBronze: draft.secondBronze,
        })
        .where(eq(podiums.id, id));
      if (revision) await tx.insert(podiumRevisions).values({ podiumId: id, ...revision });
    });
  }
}
