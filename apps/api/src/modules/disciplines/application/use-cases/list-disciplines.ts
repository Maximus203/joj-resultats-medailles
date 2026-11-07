import { Injectable } from '@nestjs/common';
import type { Discipline } from '../../domain/discipline';
import { DisciplineRepository } from '../discipline.repository';

@Injectable()
export class ListDisciplines {
  constructor(private readonly disciplines: DisciplineRepository) {}

  execute(): Promise<Discipline[]> {
    return this.disciplines.list();
  }
}
