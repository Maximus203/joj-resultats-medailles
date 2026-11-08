import { createHash } from 'node:crypto';

/**
 * Lecture du site officiel des résultats : pages → finales → podiums. Logique pure et testée,
 * sans import relatif : le script `pnpm db:scrape` (Node, sans compilation) charge ce fichier tel
 * quel, et l'API s'en sert pour son import automatique. Le réseau est derrière `OfficialSource`.
 */

/** Une finale terminée du calendrier officiel (une « unité » du site). */
export interface FinalUnit {
  /** Code de l'unité sur le site officiel (ex. `SWMW50MFR-----…FNL-000100--`). */
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

/** Le podium qu'on tire d'une finale. `id` est stable : une même épreuve a toujours le même. */
export interface PodiumDraft {
  id: string;
  eventName: string;
  eventKey: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
  /** Le second bronze des sports de combat à deux bronzes ; `null` sinon. */
  secondBronze: string | null;
}

/** Pourquoi une finale vue sur le site n'est pas devenue un podium. */
export type IgnoredReason =
  | 'NO_MEDALS'
  | 'INCOMPLETE_PODIUM'
  | 'TIED_PLACES'
  | 'TOO_MANY_BRONZE'
  | 'SAME_COUNTRY'
  | 'FETCH_FAILED';

export interface IgnoredFinal {
  day: string;
  discipline: string;
  competition: string;
  code: string;
  reason: IgnoredReason;
  detail: string;
}

export type DraftResult =
  | { ok: true; draft: PodiumDraft }
  | { ok: false; reason: IgnoredReason; detail: string };

/** Les deux pages du site dont l'import a besoin ; l'adaptateur HTTP (ou un faux) les rend. */
export interface OfficialSource {
  /** Le calendrier d'un jour (AAAA-MM-JJ), en HTML. */
  schedule(day: string): Promise<string>;
  /** La page « Medallists » d'une unité, en HTML. */
  medalList(code: string): Promise<string>;
}

export interface Collection {
  drafts: PodiumDraft[];
  ignored: IgnoredFinal[];
  /** Les épreuves (finales terminées candidates) vues sur le site, importées ou non. */
  finalsSeen: number;
  /** Les clés de ces épreuves : sert à repérer ce que la base a et que le site n'a plus. */
  eventKeysSeen: string[];
  daysRead: string[];
  daysFailed: string[];
  errors: string[];
}

const ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&amp;': '&',
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
};

/** Les unités terminées qui ne décernent pas de podium : placements, bronze, séries, manches. */
const NOT_A_PODIUM_UNIT = /Plac(?:ing|ement)|Classification|Bronze|\bSeries\b|\bRace \d/i;

function decode(text: string): string {
  return text.replace(/&#39;|&amp;|&quot;|&lt;|&gt;/g, (entity) => ENTITIES[entity] ?? entity);
}

/** Le calendrier contient des lignes d'épreuves : la page a bien la structure attendue. */
export function hasScheduleStructure(scheduleHtml: string): boolean {
  return scheduleHtml.includes('<div class="scheduleItem');
}

/**
 * Les finales terminées d'une journée du calendrier officiel : celles marquées « or », et celles
 * que le site ne marque pas (wushu combiné, équitation) mais dont le code dit « finale ».
 */
export function parseFinalUnits(scheduleHtml: string, day: string): FinalUnit[] {
  const units: FinalUnit[] = [];
  for (const item of scheduleHtml.split(/<div class="scheduleItem/).slice(1)) {
    const status = item.match(/textStatus">([^<]*)</)?.[1]?.trim();
    const code = item.match(/ResultList\/([^"]+)"/)?.[1] ?? item.match(/rscCode="([^"]+)"/)?.[1];
    const names = item.match(
      /<\/div>\s*([^<]+?)\s*<\/div><div class="competition-name">\s*([^<]+?)\s*<\/div>/,
    );
    if (status !== 'Finished' || !code || !names) continue;
    const discipline = decode(names[1] ?? '');
    const competition = decode(names[2] ?? '');
    const isGold = item.startsWith(' medal-match gold');
    const isOtherFinal =
      code.includes('FNL-') &&
      !item.startsWith(' medal-match') &&
      !NOT_A_PODIUM_UNIT.test(competition);
    if (isGold || isOtherFinal) units.push({ code, discipline, competition, day });
  }
  return units;
}

/** « Women's 50m Freestyle Final » → « Women's 50m Freestyle » : on garde l'épreuve, pas le tour. */
export function eventNameOf(competition: string): string {
  return competition.replace(/\s+(Finals?\b.*|Fastest Heat)$/, '').trim();
}

/** Le nom de l'épreuve : il porte la discipline, car « Men -55 kg » existe en judo et en lutte. */
export function eventLabelOf(unit: Pick<FinalUnit, 'discipline' | 'competition'>): string {
  return `${unit.discipline} – ${eventNameOf(unit.competition)}`.replace(/\s+/g, ' ');
}

/** La clé d'unicité d'une épreuve : son nom en minuscules (celle de la table `podiums`). */
export function eventKeyOf(unit: Pick<FinalUnit, 'discipline' | 'competition'>): string {
  return eventLabelOf(unit).toLowerCase();
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

/** Une UUID v5 (SHA-1) tirée de la clé de l'épreuve : relancer l'import redonne les mêmes id. */
export function podiumIdOf(eventKey: string): string {
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
 * Le podium d'une finale, ou la raison pour laquelle elle n'en donne pas. Un second bronze est
 * gardé (judo, lutte, triathlon) ; une égalité à l'or ou à l'argent n'a pas de place dans un
 * podium à un seul or et un seul argent : elle est signalée, jamais devinée.
 */
export function toPodiumDraft(unit: FinalUnit, rows: MedalRow[]): DraftResult {
  const countriesOf = (medal: MedalRow['medal']) =>
    rows.filter((row) => row.medal === medal).map((row) => row.noc);
  const [golds, silvers, bronzes] = [
    countriesOf('gold'),
    countriesOf('silver'),
    countriesOf('bronze'),
  ];
  const fail = (reason: IgnoredReason, detail: string): DraftResult => ({
    ok: false,
    reason,
    detail,
  });
  if (rows.length === 0) return fail('NO_MEDALS', 'aucune médaille publiée');
  if (golds.length > 1 || silvers.length > 1) {
    const tied = [
      golds.length > 1 ? `à l’or (${golds.join(', ')})` : '',
      silvers.length > 1 ? `à l’argent (${silvers.join(', ')})` : '',
    ].filter(Boolean);
    const missing = silvers.length === 0 ? ', pas d’argent' : '';
    return fail('TIED_PLACES', `égalité ${tied.join(' et ')}${missing}`);
  }
  const [gold, silver, bronze, secondBronze] = [golds[0], silvers[0], bronzes[0], bronzes[1]];
  if (!gold || !silver || !bronze) {
    return fail(
      'INCOMPLETE_PODIUM',
      `or ${golds.length}, argent ${silvers.length}, bronze ${bronzes.length}`,
    );
  }
  if (bronzes.length > 2) return fail('TOO_MANY_BRONZE', `${bronzes.length} bronzes`);
  const countries = secondBronze ? [gold, silver, bronze, secondBronze] : [gold, silver, bronze];
  if (new Set(countries).size < countries.length) {
    return fail('SAME_COUNTRY', `pays répété : ${countries.join(', ')}`);
  }
  const eventName = eventLabelOf(unit);
  const eventKey = eventName.toLowerCase();
  return {
    ok: true,
    draft: {
      id: podiumIdOf(eventKey),
      eventName,
      eventKey,
      discipline: unit.discipline,
      day: unit.day,
      gold,
      silver,
      bronze,
      secondBronze: secondBronze ?? null,
    },
  };
}

/** Les jours AAAA-MM-JJ de `first` à `last` inclus. */
export function daysBetween(first: string, last: string): string[] {
  const days: string[] = [];
  for (let t = Date.parse(first); t <= Date.parse(last); t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Lit le site pour ces jours : calendrier de chaque jour, puis page des médaillés de chaque
 * épreuve. Rien ne s'arrête sur une page en échec : le jour ou l'épreuve est noté, le reste suit.
 * Une épreuve à plusieurs unités (wushu) est lue jusqu'à la première qui donne un podium.
 */
export async function collectOfficialPodiums(
  source: OfficialSource,
  days: readonly string[],
): Promise<Collection> {
  const result: Collection = {
    drafts: [],
    ignored: [],
    finalsSeen: 0,
    eventKeysSeen: [],
    daysRead: [],
    daysFailed: [],
    errors: [],
  };
  const events = new Map<string, FinalUnit[]>();
  for (const day of days) {
    try {
      const calendar = await source.schedule(day);
      // Un calendrier sans aucune ligne n'est pas « un jour sans finale » : c'est un site en
      // maintenance ou modifié. Un jour calme garde ses lignes d'épreuves non finales.
      if (!hasScheduleStructure(calendar)) {
        throw new Error('structure du calendrier absente : page vide, en maintenance ou modifiée');
      }
      for (const unit of parseFinalUnits(calendar, day)) {
        events.set(eventKeyOf(unit), [...(events.get(eventKeyOf(unit)) ?? []), unit]);
      }
      result.daysRead.push(day);
    } catch (error) {
      result.daysFailed.push(day);
      result.errors.push(`${day} : calendrier illisible (${messageOf(error)})`);
    }
  }
  for (const [eventKey, units] of events) {
    result.finalsSeen += 1;
    result.eventKeysSeen.push(eventKey);
    const failure = await firstPodium(source, units, result);
    if (failure) result.ignored.push(failure);
  }
  return result;
}

/** Ajoute le premier podium valide des unités à `result` ; sinon rend la raison à signaler. */
async function firstPodium(
  source: OfficialSource,
  units: readonly FinalUnit[],
  result: Collection,
): Promise<IgnoredFinal | null> {
  let failure: IgnoredFinal | null = null;
  for (const unit of units) {
    let outcome: DraftResult;
    try {
      outcome = toPodiumDraft(unit, parseMedalRows(await source.medalList(unit.code)));
    } catch (error) {
      outcome = { ok: false, reason: 'FETCH_FAILED', detail: messageOf(error) };
    }
    if (outcome.ok) {
      result.drafts.push(outcome.draft);
      return null;
    }
    // On garde la raison la plus parlante : « aucune médaille » ne l'emporte sur une autre.
    if (!failure || failure.reason === 'NO_MEDALS') {
      failure = { ...locate(unit), reason: outcome.reason, detail: outcome.detail };
    }
  }
  if (failure?.reason === 'FETCH_FAILED') {
    result.errors.push(`${failure.discipline} / ${failure.competition} : ${failure.detail}`);
  }
  return failure;
}

function locate({ day, discipline, competition, code }: FinalUnit) {
  return { day, discipline, competition, code };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
