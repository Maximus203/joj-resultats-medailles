import { Injectable } from '@nestjs/common';
import { disciplineNotFound } from '../../domain/disciplines.errors';
import { DisciplineRepository } from '../discipline.repository';

@Injectable()
export class DeleteDiscipline {
  constructor(private readonly disciplines: DisciplineRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.disciplines.delete(id))) throw disciplineNotFound(id);
  }
}
