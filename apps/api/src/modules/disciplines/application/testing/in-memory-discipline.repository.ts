import { Discipline } from '../../domain/discipline';
import { disciplineNameTaken } from '../../domain/disciplines.errors';
import { DisciplineRepository } from '../discipline.repository';

/** Fake fidèle au contrat du port (unicité du nom, tri), pour tester l'application sans base. */
export class InMemoryDisciplineRepository extends DisciplineRepository {
  private readonly rows = new Map<string, Discipline>();

  async findById(id: string): Promise<Discipline | null> {
    const found = this.rows.get(id);
    return found ? clone(found) : null;
  }

  async findByName(name: string): Promise<Discipline | null> {
    const found = [...this.rows.values()].find((discipline) => discipline.name === name);
    return found ? clone(found) : null;
  }

  async list(): Promise<Discipline[]> {
    return [...this.rows.values()]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(clone);
  }

  async insert(discipline: Discipline): Promise<void> {
    this.assertNameFree(discipline);
    this.rows.set(discipline.id, clone(discipline));
  }

  async update(discipline: Discipline): Promise<void> {
    if (!this.rows.has(discipline.id)) return;
    this.assertNameFree(discipline);
    this.rows.set(discipline.id, clone(discipline));
  }

  async delete(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }

  /** Comme la contrainte d'unicité en base : une autre ligne ne peut pas porter ce nom. */
  private assertNameFree(discipline: Discipline): void {
    const taken = [...this.rows.values()].some(
      (row) => row.name === discipline.name && row.id !== discipline.id,
    );
    if (taken) throw disciplineNameTaken(discipline.name);
  }
}

/** Copie : un test ne voit pas une modification qui n'a pas été persistée. */
function clone(discipline: Discipline): Discipline {
  return Discipline.restore({
    id: discipline.id,
    name: discipline.name,
    category: discipline.category,
    createdAt: discipline.createdAt,
  });
}
