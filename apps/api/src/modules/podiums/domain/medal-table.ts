export interface PodiumMedals {
  gold: string;
  silver: string;
  bronze: string;
  /** Le second bronze des sports de combat à deux bronzes ; absent ou `null` sinon. */
  secondBronze?: string | null;
}

export interface MedalTableRow {
  rank: number;
  country: string;
  gold: number;
  silver: number;
  bronze: number;
}

type Counts = Omit<MedalTableRow, 'rank'>;

/**
 * Le tableau des médailles : une ligne par pays, triée or, argent, bronze (puis code pays pour
 * une réponse stable). Rang « à la compétition » : une égalité parfaite partage le rang, le
 * suivant saute (1, 2, 2, 4).
 */
export function buildMedalTable(podiums: readonly PodiumMedals[]): MedalTableRow[] {
  const sorted = [...countMedals(podiums).values()].sort(compare);
  // Le rang est celui de la première ligne qui a exactement les mêmes médailles.
  return sorted.map((row) => ({
    rank: sorted.findIndex((candidate) => sameMedals(candidate, row)) + 1,
    ...row,
  }));
}

function countMedals(podiums: readonly PodiumMedals[]): Map<string, Counts> {
  const counts = new Map<string, Counts>();
  const countryRow = (country: string): Counts => {
    const existing = counts.get(country);
    if (existing) return existing;
    const created = { country, gold: 0, silver: 0, bronze: 0 };
    counts.set(country, created);
    return created;
  };
  for (const { gold, silver, bronze, secondBronze } of podiums) {
    countryRow(gold).gold += 1;
    countryRow(silver).silver += 1;
    countryRow(bronze).bronze += 1;
    if (secondBronze) countryRow(secondBronze).bronze += 1;
  }
  return counts;
}

function compare(a: Counts, b: Counts): number {
  return (
    b.gold - a.gold ||
    b.silver - a.silver ||
    b.bronze - a.bronze ||
    a.country.localeCompare(b.country)
  );
}

function sameMedals(a: Counts, b: Counts): boolean {
  return a.gold === b.gold && a.silver === b.silver && a.bronze === b.bronze;
}
