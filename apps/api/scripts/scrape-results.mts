/**
 * pnpm db:scrape  récupère les podiums déjà publiés sur le site officiel des résultats des JOJ
 *                 Dakar 2026 et écrit apps/api/data/podiums.json, que `pnpm db:seed` charge.
 *
 * Mince appel au code de l'API (modules/scraping/domain/official-results.ts) : la lecture du site
 * est la même que celle de l'import automatique, et les réglages viennent de la même
 * configuration (variables SCRAPING_*). Ce script ne touche pas à la base ; en production,
 * l'API importe seule chaque soir.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Env, envSchema } from '../src/core/config/env-schema.ts';
import {
  collectOfficialPodiums,
  daysBetween,
} from '../src/modules/scraping/domain/official-results.ts';
import { planWrite } from './scrape-output-core.mts';
import { createOfficialSiteSource } from '../src/modules/scraping/infra/official-site-http.ts';

if (existsSync('.env')) process.loadEnvFile('.env');
const env = envSchema.parse(process.env);
const config = { get: <K extends keyof Env>(key: K): Env[K] => env[key] };
const outFile = fileURLToPath(new URL('../data/podiums.json', import.meta.url));

const source = createOfficialSiteSource({
  baseUrl: config.get('SCRAPING_SOURCE_URL'),
  userAgent: config.get('SCRAPING_USER_AGENT'),
  requestDelayMs: config.get('SCRAPING_REQUEST_DELAY_MS'),
  requestTimeoutMs: config.get('SCRAPING_REQUEST_TIMEOUT_MS'),
});

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
const previous = existsSync(outFile)
  ? (JSON.parse(readFileSync(outFile, 'utf8')) as unknown[]).length
  : 0;
const plan = planWrite(previous, podiums.length, process.argv.includes('--force'));
console.log(plan.message);
if (!plan.write) process.exit(1);
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(podiums, null, 2)}\n`);

console.log(
  `${collection.finalsSeen} finale(s) vue(s), ${podiums.length} podium(s) lu(s) sur le site.`,
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
