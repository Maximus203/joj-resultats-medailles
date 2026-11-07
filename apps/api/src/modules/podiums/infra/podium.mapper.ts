import { Podium } from '../domain/podium';
import type { PodiumRow } from './podiums.schema';

/** Ligne de la table → entité. */
export function toPodium(row: PodiumRow): Podium {
  return Podium.restore({
    id: row.id,
    eventName: row.eventName,
    discipline: row.discipline,
    day: row.day,
    gold: row.gold,
    silver: row.silver,
    bronze: row.bronze,
    createdAt: row.createdAt,
    correctedAt: row.correctedAt,
  });
}

/** Entité → ligne de la table. */
export function toPodiumRow(podium: Podium): PodiumRow {
  return {
    id: podium.id,
    eventName: podium.eventName,
    eventKey: podium.eventKey,
    discipline: podium.discipline,
    day: podium.day,
    gold: podium.gold,
    silver: podium.silver,
    bronze: podium.bronze,
    createdAt: podium.createdAt,
    correctedAt: podium.correctedAt,
  };
}
