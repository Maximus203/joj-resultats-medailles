import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { normalizeEventKey } from '@joj/shared';
import { Podium } from '../../domain/podium';
import { podiumAlreadyRecorded } from '../../domain/podiums.errors';
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
    // La base refuse l'écriture exacte ; ici on refuse aussi la variante (tiret du clavier, accents,
    // casse), pour qu'une saisie ne double pas une épreuve importée.
    const key = normalizeEventKey(podium.eventName);
    const known = await this.podiums.list();
    if (known.some((existing) => normalizeEventKey(existing.eventName) === key)) {
      throw podiumAlreadyRecorded(podium.eventName);
    }
    await this.podiums.add(podium);
    return podium;
  }
}
