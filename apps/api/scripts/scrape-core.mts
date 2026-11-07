import { createHash } from 'node:crypto';

/**
 * Logique pure du scraper des résultats officiels (testée) ; le réseau est dans scrape-results.mts.
 */

export interface MedalUnit {
  /** Code de l'unité de compétition sur le site officiel (ex. `SWMW50MFR-----…FNL-000100--`). */
  code: string;
  discipline: string;
  competition: string;
  /** Jour de la finale, AAAA-MM-JJ. */
  day: string;
}

export interface MedalRow {
  medal: 'gold' | 'silver' | 'bronze';
  noc: string;
}

/** Une ligne de la table `podiums`, clés en snake_case comme les colonnes. */
export interface PodiumSeedRow {
  id: string;
  event_name: string;
  event_key: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  created_at: string;
}

const ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
};

function decode(text: string): string {
  return text.replace(/&#39;|&amp;|&quot;|&lt;|&gt;/g, (entity) => ENTITIES[entity] ?? entity);
}

/** Les finales (unité qui décerne l'or) terminées d'une journée du calendrier officiel. */
export function parseMedalUnits(scheduleHtml: string, day: string): MedalUnit[] {
  const units: MedalUnit[] = [];
  for (const item of scheduleHtml.split(/<div class="scheduleItem/).slice(1)) {
    if (!item.startsWith(' medal-match gold')) continue;
    const status = item.match(/textStatus">([^<]*)</)?.[1]?.trim();
    const code = item.match(/ResultList\/([^"]+)"/)?.[1] ?? item.match(/rscCode="([^"]+)"/)?.[1];
    const names = item.match(
      /<\/div>\s*([^<]+?)\s*<\/div><div class="competition-name">\s*([^<]+?)\s*<\/div>/,
    );
    if (status !== 'Finished' || !code || !names) continue;
    units.push({
      code,
      discipline: decode(names[1] ?? ''),
      competition: decode(names[2] ?? ''),
      day,
    });
  }
  return units;
}

/** « Women's 50m Freestyle Final » → « Women's 50m Freestyle » : on garde l'épreuve, pas le tour. */
export function eventNameOf(competition: string): string {
  return competition.replace(/\s+(Finals?\b.*|Fastest Heat)$/, '').trim();
}

/** Les lignes de médaille de la page « Medallists » ; les lignes de détail (équipiers) n'en ont pas. */
export function parseMedalRows(medalListHtml: string): MedalRow[] {
  const rows: MedalRow[] = [];
  for (const row of medalListHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
    const medal = row[1]?.match(/alt="(Gold|Silver|Bronze) medal icon"/)?.[1]?.toLowerCase();
    const noc = row[1]?.match(/class="noc-element"[\s\S]*?<span>([A-Z]{3})<\/span>/)?.[1];
    if ((medal === 'gold' || medal === 'silver' || medal === 'bronze') && noc) {
      rows.push({ medal, noc });
    }
  }
  return rows;
}

/** Une UUID v5 (SHA-1) tirée de la clé de l'épreuve : relancer le scraper redonne les mêmes id. */
function idOf(eventKey: string): string {
  const hash = createHash('sha1').update(`joj-dakar-2026:${eventKey}`).digest();
  hash[6] = ((hash[6] ?? 0) & 0x0f) | 0x50;
  hash[8] = ((hash[8] ?? 0) & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * Le podium d'une épreuve. La table n'a qu'un bronze : quand l'épreuve en décerne deux (judo,
 * lutte…), on garde le premier de la liste officielle. Le nom porte la discipline, car la clé
 * d'unicité de `podiums` est le nom seul (« Men -55 kg » existe en judo et en lutte).
 */
export function toPodiumRow(unit: MedalUnit, rows: MedalRow[], now: Date): PodiumSeedRow {
  const first = (medal: MedalRow['medal']) => rows.find((row) => row.medal === medal)?.noc;
  const gold = first('gold');
  const silver = first('silver');
  const bronze = first('bronze');
  if (!gold || !silver || !bronze) {
    throw new Error(
      `${unit.code} : il faut gold, silver and bronze, trouvé ${rows.length} médaille(s)`,
    );
  }
  if (new Set([gold, silver, bronze]).size < 3) {
    throw new Error(
      `${unit.code} : les trois pays doivent être distinct (${gold}, ${silver}, ${bronze})`,
    );
  }
  const eventName = `${unit.discipline} – ${eventNameOf(unit.competition)}`.replace(/\s+/g, ' ');
  const eventKey = eventName.toLowerCase();
  return {
    id: idOf(eventKey),
    event_name: eventName,
    event_key: eventKey,
    discipline: unit.discipline,
    day: unit.day,
    gold,
    silver,
    bronze,
    created_at: now.toISOString(),
  };
}
