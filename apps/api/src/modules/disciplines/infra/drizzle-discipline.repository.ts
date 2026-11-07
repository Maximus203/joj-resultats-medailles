import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { isUniqueViolation } from '../../../core/database/pg-errors';
import { DisciplineRepository } from '../application/discipline.repository';
import type { Discipline } from '../domain/discipline';
import { disciplineNameTaken } from '../domain/disciplines.errors';
import { toDomain, toRow } from './discipline.mapper';
import { DISCIPLINES_NAME_KEY, disciplines } from './disciplines.schema';

@Injectable()
export class DrizzleDisciplineRepository extends DisciplineRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Discipline | null> {
    const [row] = await this.db.select().from(disciplines).where(eq(disciplines.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async findByName(name: string): Promise<Discipline | null> {
    const [row] = await this.db
      .select()
      .from(disciplines)
      .where(eq(disciplines.name, name))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async list(): Promise<Discipline[]> {
    const rows = await this.db.select().from(disciplines).orderBy(asc(disciplines.name));
    return rows.map(toDomain);
  }

  async insert(discipline: Discipline): Promise<void> {
    try {
      await this.db.insert(disciplines).values(toRow(discipline));
    } catch (error) {
      if (isUniqueViolation(error, DISCIPLINES_NAME_KEY)) {
        throw disciplineNameTaken(discipline.name);
      }
      throw error;
    }
  }

  async update(discipline: Discipline): Promise<void> {
    const { id, name, category } = toRow(discipline);
    try {
      await this.db.update(disciplines).set({ name, category }).where(eq(disciplines.id, id));
    } catch (error) {
      if (isUniqueViolation(error, DISCIPLINES_NAME_KEY)) {
        throw disciplineNameTaken(name);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(disciplines)
      .where(eq(disciplines.id, id))
      .returning({ id: disciplines.id });
    return deleted.length > 0;
  }
}
