import { Injectable } from '@nestjs/common';
import type { Podium } from '../../domain/podium';
import { podiumNotFound } from '../../domain/podiums.errors';
import { PodiumRepository } from '../podium.repository';

export interface CorrectPodiumInput {
  id: string;
  gold: string;
  silver: string;
  bronze: string;
}

@Injectable()
export class CorrectPodium {
  constructor(private readonly podiums: PodiumRepository) {}

  async execute({ id, ...medals }: CorrectPodiumInput): Promise<Podium> {
    const current = await this.podiums.findById(id);
    if (!current) throw podiumNotFound(id);
    const { podium, revision } = current.correct(medals, new Date());
    if (revision) await this.podiums.saveCorrection(podium, revision);
    return podium;
  }
}
