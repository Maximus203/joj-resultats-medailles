import { desc, eq } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { isUniqueViolation } from '../../../core/database/pg-errors';
import { PodiumRepository } from '../application/podium.repository';
import type { Podium } from '../domain/podium';
import type { PodiumRevision } from '../domain/podium-revision';
import { podiumAlreadyRecorded } from '../domain/podiums.errors';
import { toPodium, toPodiumRow } from './podium.mapper';
import { PODIUMS_EVENT_KEY_UNIQUE, podiumRevisions, podiums } from './podiums.schema';

@Injectable()
export class DrizzlePodiumRepository extends PodiumRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async add(podium: Podium): Promise<void> {
    try {
      await this.db.insert(podiums).values(toPodiumRow(podium));
    } catch (error) {
      if (isUniqueViolation(error, PODIUMS_EVENT_KEY_UNIQUE)) {
        throw podiumAlreadyRecorded(podium.eventName);
      }
      throw error;
    }
  }

  async list(day?: string): Promise<Podium[]> {
    const rows = await this.db
      .select()
      .from(podiums)
      .where(day === undefined ? undefined : eq(podiums.day, day));
    return rows.map(toPodium);
  }

  async findById(id: string): Promise<Podium | null> {
    const [row] = await this.db.select().from(podiums).where(eq(podiums.id, id));
    return row ? toPodium(row) : null;
  }

  async saveCorrection(podium: Podium, revision: PodiumRevision | null): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(podiums)
        .set({
          gold: podium.gold,
          silver: podium.silver,
          bronze: podium.bronze,
          correctedAt: podium.correctedAt,
        })
        .where(eq(podiums.id, podium.id));
      if (revision) await tx.insert(podiumRevisions).values({ podiumId: podium.id, ...revision });
    });
  }

  async revisionsOf(id: string): Promise<PodiumRevision[]> {
    const rows = await this.db
      .select()
      .from(podiumRevisions)
      .where(eq(podiumRevisions.podiumId, id))
      .orderBy(desc(podiumRevisions.correctedAt));
    return rows.map(({ gold, silver, bronze, correctedAt }) => ({
      gold,
      silver,
      bronze,
      correctedAt,
    }));
  }
}
