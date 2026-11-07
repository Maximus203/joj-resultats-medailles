import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Podium } from '../../domain/podium';
import { PodiumRepository } from '../podium.repository';

export interface RecordPodiumInput {
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
}

@Injectable()
export class RecordPodium {
  constructor(private readonly podiums: PodiumRepository) {}

  async execute(input: RecordPodiumInput): Promise<Podium> {
    const podium = Podium.create({ id: randomUUID(), ...input, now: new Date() });
    await this.podiums.add(podium);
    return podium;
  }
}
