import { Injectable } from '@nestjs/common';
import type { Podium } from '../../domain/podium';
import { PodiumRepository } from '../podium.repository';

@Injectable()
export class ListPodiums {
  constructor(private readonly podiums: PodiumRepository) {}

  /** Les podiums d'un jour (tous sans `day`), le dernier enregistré d'abord. */
  async execute({ day }: { day?: string | undefined }): Promise<Podium[]> {
    return (await this.podiums.list(day)).sort(mostRecentFirst);
  }
}

function mostRecentFirst(a: Podium, b: Podium): number {
  return b.createdAt.getTime() - a.createdAt.getTime() || a.eventKey.localeCompare(b.eventKey);
}
