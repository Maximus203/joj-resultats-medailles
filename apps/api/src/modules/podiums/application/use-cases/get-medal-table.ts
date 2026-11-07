import { Injectable } from '@nestjs/common';
import { buildMedalTable, type MedalTableRow } from '../../domain/medal-table';
import { PodiumRepository } from '../podium.repository';

@Injectable()
export class GetMedalTable {
  constructor(private readonly podiums: PodiumRepository) {}

  async execute(): Promise<MedalTableRow[]> {
    return buildMedalTable(await this.podiums.list());
  }
}
