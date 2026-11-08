/**
 * pnpm db:scrape  récupère les podiums déjà publiés sur le site officiel des résultats des JOJ
 *                 Dakar 2026 et écrit apps/api/data/podiums.json, que `pnpm db:seed` charge.
 *
 * Mince appel au code de l'API (modules/scraping/domain/official-results.ts) : la lecture du site
 * est la même que celle de l'import automatique, et les réglages viennent de la même
 * configuration (variables SCRAPING_*). Ce script ne touche pas à la base ; en production,
 * l'API importe seule chaque soir.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Env, envSchema } from '../src/core/config/env-schema.ts';
import {
  collectOfficialPodiums,
  daysBetween,
  type OfficialSource,
} from '../src/modules/scraping/domain/official-results.ts';

if (existsSync('.env')) process.loadEnvFile('.env');
const env = envSchema.parse(process.env);
const config = { get: <K extends keyof Env>(key: K): Env[K] => env[key] };
const outFile = fileURLToPath(new URL('../data/podiums.json', import.meta.url));

async function get(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': config.get('SCRAPING_USER_AGENT') },
    signal: AbortSignal.timeout(config.get('SCRAPING_REQUEST_TIMEOUT_MS')),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} sur ${url}`);
  await new Promise((resolve) => setTimeout(resolve, config.get('SCRAPING_REQUEST_DELAY_MS')));
  return response.text();
}

/** AAAA-MM-JJ → JJMMAAAA, le format du paramètre `day` du site. */
function siteDay(day: string): string {
  const [year, month, date] = day.split('-');
  return `${date}${month}${year}`;
}

const base = config.get('SCRAPING_SOURCE_URL');
const source: OfficialSource = {
  schedule: (day) => get(`${base}/ScheduleDatePartial?sportCode=---&day=${siteDay(day)}`),
  medalList: (code) =>
    get(`${base}/ListPartial?pagetype=MedalList&rsc=${encodeURIComponent(code)}`),
};

const collection = await collectOfficialPodiums(
  source,
  daysBetween(config.get('SCRAPING_FIRST_DAY'), config.get('SCRAPING_LAST_DAY')).filter(
    (day) => day <= new Date().toISOString().slice(0, 10),
  ),
);

const createdAt = new Date().toISOString();
const podiums = collection.drafts
  .map((draft) => ({
    id: draft.id,
    event_name: draft.eventName,
    event_key: draft.eventKey,
    discipline: draft.discipline,
    day: draft.day,
    gold: draft.gold,
    silver: draft.silver,
    bronze: draft.bronze,
    ...(draft.secondBronze ? { second_bronze: draft.secondBronze } : {}),
    created_at: createdAt,
  }))
  .sort((a, b) => a.day.localeCompare(b.day) || a.event_name.localeCompare(b.event_name));
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(podiums, null, 2)}\n`);

console.log(
  `${collection.finalsSeen} finale(s) vue(s), ${podiums.length} podium(s) écrit(s) dans data/podiums.json`,
);
if (collection.ignored.length > 0) {
  const lines = collection.ignored.map(
    (item) =>
      `${item.day} ${item.discipline} / ${item.competition} : ${item.reason} (${item.detail})`,
  );
  console.warn(`${collection.ignored.length} finale(s) ignorée(s) :\n- ${lines.join('\n- ')}`);
}
if (collection.daysFailed.length > 0) {
  console.warn(`Jours illisibles : ${collection.daysFailed.join(', ')}`);
}
