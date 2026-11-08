import { type PodiumDraft, podiumIdOf } from './official-results';
import type { PodiumDifference, PodiumMedals, ScrapedEvent } from './scrape-run';

/** Un podium de la base, tel que l'import a besoin de le voir. */
export interface StoredPodium extends PodiumMedals {
  id: string;
  eventKey: string;
  eventName: string;
  day: string;
  correctedAt: Date | null;
}

/** La version de la source remplace celle de la base ; l'ancienne reste consultable (révision). */
export interface PlannedUpdate {
  draft: PodiumDraft;
  current: StoredPodium;
  difference: PodiumDifference;
}

export interface Reconciliation {
  inserts: PodiumDraft[];
  updates: PlannedUpdate[];
  kept: PodiumDifference[];
  identical: number;
  absent: ScrapedEvent[];
}

export interface ReconciliationInput {
  existing: readonly StoredPodium[];
  drafts: readonly PodiumDraft[];
  /** Les clés de toutes les épreuves vues sur la source, podium obtenu ou non. */
  eventKeysSeen: readonly string[];
  daysRead: readonly string[];
}

/**
 * Règle de conflit : la clé d'une épreuve (son nom en minuscules) la désigne. Absente de la base,
 * elle est insérée ; identique, elle est laissée ; différente, elle n'est remplacée que si le podium
 * est celui de l'import (identifiant stable) et que le journaliste ne l'a jamais corrigé. Un podium
 * saisi à la main ou corrigé reste tel quel : l'écart est listé, jamais appliqué.
 */
export function reconcile({
  existing,
  drafts,
  eventKeysSeen,
  daysRead,
}: ReconciliationInput): Reconciliation {
  const byKey = new Map(existing.map((podium) => [podium.eventKey, podium]));
  const result: Reconciliation = { inserts: [], updates: [], kept: [], identical: 0, absent: [] };
  for (const draft of drafts) {
    const stored = byKey.get(draft.eventKey);
    if (!stored) {
      result.inserts.push(draft);
    } else if (sameMedals(stored, draft)) {
      result.identical += 1;
    } else {
      const reason = protectionOf(stored);
      const difference: PodiumDifference = {
        eventName: stored.eventName,
        day: stored.day,
        outcome: reason ? 'kept' : 'updated',
        reason,
        current: medalsOf(stored),
        source: medalsOf(draft),
      };
      if (reason) result.kept.push(difference);
      else result.updates.push({ draft, current: stored, difference });
    }
  }
  const seen = new Set(eventKeysSeen);
  const read = new Set(daysRead);
  result.absent = existing
    .filter((podium) => read.has(podium.day) && !seen.has(podium.eventKey))
    .map(({ eventName, day }) => ({ eventName, day }));
  return result;
}

function protectionOf(stored: StoredPodium): 'CORRECTED' | 'MANUAL' | null {
  if (stored.correctedAt) return 'CORRECTED';
  return stored.id === podiumIdOf(stored.eventKey) ? null : 'MANUAL';
}

function medalsOf({ gold, silver, bronze, secondBronze }: PodiumMedals): PodiumMedals {
  return { gold, silver, bronze, secondBronze };
}

function sameMedals(a: PodiumMedals, b: PodiumMedals): boolean {
  return (
    a.gold === b.gold &&
    a.silver === b.silver &&
    a.bronze === b.bronze &&
    a.secondBronze === b.secondBronze
  );
}
