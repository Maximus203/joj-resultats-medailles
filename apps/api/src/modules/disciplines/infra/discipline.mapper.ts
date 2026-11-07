import { disciplineCategorySchema } from '@joj/shared';
import { Discipline } from '../domain/discipline';
import type { DisciplineRow } from './disciplines.schema';

/** Ligne de la table → entité. Une catégorie inconnue en base est un bug : on échoue tôt. */
export function toDomain(row: DisciplineRow): Discipline {
  return Discipline.restore({
    id: row.id,
    name: row.name,
    category: disciplineCategorySchema.parse(row.category),
    createdAt: row.createdAt,
  });
}

/** Entité → ligne de la table. */
export function toRow(discipline: Discipline): DisciplineRow {
  return {
    id: discipline.id,
    name: discipline.name,
    category: discipline.category,
    createdAt: discipline.createdAt,
  };
}
