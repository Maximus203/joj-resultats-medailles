/**
 * pnpm db:scrape  récupère les podiums déjà publiés sur le site officiel des résultats des JOJ
 *                 Dakar 2026 et écrit apps/api/data/podiums.json, que `pnpm db:seed` charge.
 *
 * Source : https://webresult.apps.dakar2026.org (résultats officiels, pages publiques).
 * Pour chaque jour des Jeux : le calendrier repère les finales terminées, puis la page
 * « Medallists » de chaque finale donne l'or, l'argent et le bronze. Relancer le scraper met le
 * fichier à jour au fil des Jeux ; les id sont stables, le seed ignore les doublons.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMedalRows,
  parseMedalUnits,
  toPodiumRow,
  type MedalUnit,
  type PodiumSeedRow,
} from './scrape-core.mts';

const BASE = 'https://webresult.apps.dakar2026.org/nh/en/Comp';
const FIRST_DAY = '2026-11-01';
const LAST_DAY = '2026-11-13';
const PAUSE_MS = 250;
const outFile = fileURLToPath(new URL('../data/podiums.json', import.meta.url));

async function get(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'joj-bootcamp-scraper/0.1 (projet pédagogique)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} sur ${url}`);
  await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  return response.text();
}

function daysBetween(first: string, last: string): string[] {
  const days: string[] = [];
  for (let t = Date.parse(first); t <= Date.parse(last); t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** AAAA-MM-JJ → JJMMAAAA, le format du paramètre `day` du site. */
function siteDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}${month}${year}`;
}

const units: MedalUnit[] = [];
for (const day of daysBetween(FIRST_DAY, LAST_DAY)) {
  const html = await get(`${BASE}/ScheduleDatePartial?sportCode=---&day=${siteDay(day)}`);
  const found = parseMedalUnits(html, day);
  console.log(`${day} : ${found.length} finale(s) terminée(s)`);
  units.push(...found);
}

const now = new Date();
const rows: PodiumSeedRow[] = [];
const problems: string[] = [];
for (const unit of units) {
  try {
    const html = await get(
      `${BASE}/ListPartial?pagetype=MedalList&rsc=${encodeURIComponent(unit.code)}`,
    );
    rows.push(toPodiumRow(unit, parseMedalRows(html), now));
  } catch (error) {
    problems.push(`${unit.discipline} / ${unit.competition} : ${(error as Error).message}`);
  }
}

// Deux finales d'une même épreuve (Wushu, équipes…) donnent la même clé : on garde la dernière.
const byKey = new Map(rows.map((row) => [row.event_key, row]));
const podiums = [...byKey.values()].sort(
  (a, b) => a.day.localeCompare(b.day) || a.event_name.localeCompare(b.event_name),
);
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(podiums, null, 2)}\n`);

console.log(`\n${podiums.length} podium(s) écrit(s) dans data/podiums.json`);
if (problems.length > 0) {
  console.warn(`${problems.length} épreuve(s) ignorée(s) :\n- ${problems.join('\n- ')}`);
}
