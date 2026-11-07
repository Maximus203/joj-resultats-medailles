import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { CreateDisciplineInput } from '@joj/shared';
import { Discipline } from '../../domain/discipline';
import { disciplineNameTaken } from '../../domain/disciplines.errors';
import { DisciplineRepository } from '../discipline.repository';

@Injectable()
export class CreateDiscipline {
  constructor(private readonly disciplines: DisciplineRepository) {}

  async execute(input: CreateDisciplineInput): Promise<Discipline> {
    const discipline = Discipline.create({
      id: randomUUID(),
      name: input.name,
      category: input.category,
      now: new Date(),
    });
    // Message clair dans le cas courant ; la contrainte d'unicité couvre deux créations simultanées.
    if (await this.disciplines.findByName(discipline.name)) {
      throw disciplineNameTaken(discipline.name);
    }
    await this.disciplines.insert(discipline);
    return discipline;
  }
}
