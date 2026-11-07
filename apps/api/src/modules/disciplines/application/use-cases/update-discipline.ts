import { Injectable } from '@nestjs/common';
import type { UpdateDisciplineInput } from '@joj/shared';
import type { Discipline } from '../../domain/discipline';
import { disciplineNameTaken, disciplineNotFound } from '../../domain/disciplines.errors';
import { DisciplineRepository } from '../discipline.repository';

@Injectable()
export class UpdateDiscipline {
  constructor(private readonly disciplines: DisciplineRepository) {}

  async execute(id: string, input: UpdateDisciplineInput): Promise<Discipline> {
    const discipline = await this.disciplines.findById(id);
    if (!discipline) throw disciplineNotFound(id);
    if (input.name !== undefined) discipline.rename(input.name);
    if (input.category !== undefined) discipline.changeCategory(input.category);

    // Garder son propre nom est permis ; prendre celui d'une autre discipline ne l'est pas.
    const sameName = await this.disciplines.findByName(discipline.name);
    if (sameName && sameName.id !== discipline.id) {
      throw disciplineNameTaken(discipline.name);
    }
    await this.disciplines.update(discipline);
    return discipline;
  }
}
