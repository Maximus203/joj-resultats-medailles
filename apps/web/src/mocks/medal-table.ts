import type { MedalRow, PublishedPodium } from '@joj/shared';

/** Le tableau des médailles d'une liste de podiums : or, puis argent, puis bronze, rang « à la compétition ». */
export function computeMedalTable(podiums: readonly PublishedPodium[]): MedalRow[] {
  const counts = new Map<string, { gold: number; silver: number; bronze: number }>();
  const entry = (country: string) => {
    const existing = counts.get(country);
    if (existing) return existing;
    const created = { gold: 0, silver: 0, bronze: 0 };
    counts.set(country, created);
    return created;
  };
  for (const podium of podiums) {
    entry(podium.gold).gold += 1;
    entry(podium.silver).silver += 1;
    entry(podium.bronze).bronze += 1;
    if (podium.secondBronze) entry(podium.secondBronze).bronze += 1;
  }
  const sorted = [...counts]
    .map(([country, medals]) => ({ country, ...medals }))
    .sort(
      (a, b) =>
        b.gold - a.gold ||
        b.silver - a.silver ||
        b.bronze - a.bronze ||
        a.country.localeCompare(b.country),
    );
  const rows: MedalRow[] = [];
  for (const [index, row] of sorted.entries()) {
    const previous = rows[index - 1];
    const tied =
      previous !== undefined &&
      previous.gold === row.gold &&
      previous.silver === row.silver &&
      previous.bronze === row.bronze;
    rows.push({ ...row, rank: tied ? previous.rank : index + 1 });
  }
  return rows;
}
