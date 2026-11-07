import { eq } from 'drizzle-orm';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { isUniqueViolation } from '../../../core/database/pg-errors';
import { PodiumRepository } from '../application/podium.repository';
import type { Podium } from '../domain/podium';
import { podiumAlreadyRecorded } from '../domain/podiums.errors';
import { toPodium, toPodiumRow } from './podium.mapper';
import { PODIUMS_EVENT_KEY_UNIQUE, podiums } from './podiums.schema';

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
}
