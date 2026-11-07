import { Injectable } from '@nestjs/common';
import type { PodiumRevision } from '../../domain/podium-revision';
import { podiumNotFound } from '../../domain/podiums.errors';
import { PodiumRepository } from '../podium.repository';

@Injectable()
export class ListPodiumRevisions {
  constructor(private readonly podiums: PodiumRepository) {}

  /** Les versions remplacées du podium, la plus récente d'abord. */
  async execute(id: string): Promise<PodiumRevision[]> {
    if (!(await this.podiums.findById(id))) throw podiumNotFound(id);
    return this.podiums.revisionsOf(id);
  }
}
