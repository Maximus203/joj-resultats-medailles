/**
 * pnpm --filter @joj/api dev:fake-site [port]  sert un faux site officiel des résultats (pages
 * inventées, même structure HTML que le vrai) pour essayer l'import automatique sans toucher au
 * vrai site : SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp.
 *
 * Réglages à chaud (GET, pour un testeur ou un curl) :
 *   /__set?code=J66-FNL&medals=gold:UKR,silver:CAN,bronze:ARG   remplace les médaillés d'une unité
 *   /__fail?match=ScheduleDatePartial&day=02112026               toute URL contenant ces morceaux répond 500
 *   /__raw?body=Maintenance                                       les calendriers répondent 200 avec ce corps
 *   /__final?day=today&code=NEW-FNL&discipline=Judo&competition=Men%20-73%20kg%20Final&medals=gold:USA,silver:CAN,bronze:ARG
 *                                                                 ajoute une finale terminée (day : today, yesterday ou AAAA-MM-JJ)
 *   /__heal                                                       lève toutes les pannes
 */
import { createServer } from 'node:http';
import {
  medalPage,
  scheduleItem,
} from '../src/modules/scraping/application/testing/official-pages.ts';

const port = Number(process.argv[2] ?? 4010);

const SCHEDULES: Record<string, string[]> = {
  '2026-11-01': [
    scheduleItem('medal-match gold', 'J66-FNL', 'Judo', 'Men -66 kg Final'),
    scheduleItem('medal-match gold', 'S50-FNL', 'Swimming', 'Women&#39;s 50m Freestyle Final'),
    scheduleItem('medal-match gold', 'FLY-FNL', 'Swimming', 'Men 50m Butterfly Final'),
    scheduleItem('', 'WST-FNL-000100--', 'Wushu Taolu', 'Men&#39;s Taijiquan Combined Final A'),
    scheduleItem('', 'LATER-FNL', 'Badminton', 'Men Final', 'Scheduled'),
  ],
  '2026-11-02': [
    scheduleItem(
      'medal-match gold',
      'W80-FNL',
      'Beach Wrestling',
      'Men 80kg Finals Gold Medal Match #69',
    ),
    scheduleItem(
      'medal-match gold',
      'W55-FNL',
      'Beach Wrestling',
      'Women 55kg Finals Gold Medal Match #67',
    ),
  ],
};

const MEDALS = new Map<string, [string, string][]>([
  [
    'J66-FNL',
    [
      ['Gold', 'UKR'],
      ['Silver', 'CAN'],
      ['Bronze', 'ARG'],
      ['Bronze', 'SEN'],
    ],
  ],
  [
    'S50-FNL',
    [
      ['Gold', 'GBR'],
      ['Silver', 'ITA'],
      ['Bronze', 'FRA'],
    ],
  ],
  [
    'FLY-FNL',
    [
      ['Gold', 'GRE'],
      ['Gold', 'POR'],
      ['Bronze', 'BEL'],
    ],
  ],
  [
    'WST-FNL-000100--',
    [
      ['Gold', 'HKG'],
      ['Silver', 'VIE'],
      ['Bronze', 'JPN'],
    ],
  ],
  [
    'W80-FNL',
    [
      ['Gold', 'SEN'],
      ['Silver', 'AZE'],
      ['Bronze', 'IRI'],
    ],
  ],
  [
    'W55-FNL',
    [
      ['Gold', 'SEN'],
      ['Silver', 'JPN'],
      ['Bronze', 'COD'],
    ],
  ],
]);

function resolveDay(day: string): string {
  const offset = day === 'today' ? 0 : day === 'yesterday' ? -1 : null;
  if (offset === null) return day;
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

function parseMedals(medals: string): [string, string][] {
  return medals
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [medal = '', noc = ''] = pair.split(':');
      return [medal.charAt(0).toUpperCase() + medal.slice(1), noc] as [string, string];
    });
}

const failing: string[][] = [];
/** Les finales ajoutées à chaud par `/__final`, par jour. */
const extras = new Map<string, string[]>();
let rawCalendar: string | null = null;
/** Un jour sans finale garde la structure du calendrier : une épreuve non finale. */
const QUIET_DAY = scheduleItem('', 'X-QFNL', 'Judo', 'Quarterfinals');

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://fake');
  const text = (status: number, body: string) => {
    response.statusCode = status;
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(body);
  };
  if (url.pathname === '/__heal') {
    failing.length = 0;
    rawCalendar = null;
    return text(200, 'ok');
  }
  if (url.pathname === '/__raw') {
    rawCalendar = url.searchParams.get('body') ?? '';
    return text(200, 'ok');
  }
  if (url.pathname === '/__fail') {
    failing.push([...url.searchParams.values()]);
    return text(200, 'ok');
  }
  if (url.pathname === '/__final') {
    const day = resolveDay(url.searchParams.get('day') ?? 'today');
    const code = url.searchParams.get('code') ?? 'NEW-FNL';
    const item = scheduleItem(
      'medal-match gold',
      code,
      url.searchParams.get('discipline') ?? 'Judo',
      url.searchParams.get('competition') ?? 'Final',
    );
    extras.set(day, [...(extras.get(day) ?? []), item]);
    MEDALS.set(code, parseMedals(url.searchParams.get('medals') ?? ''));
    return text(200, 'ok');
  }
  if (url.pathname === '/__set') {
    const code = url.searchParams.get('code') ?? '';
    MEDALS.set(code, parseMedals(url.searchParams.get('medals') ?? ''));
    return text(200, 'ok');
  }
  if (failing.some((parts) => parts.every((part) => request.url?.includes(part)))) {
    return text(500, 'panne simulée');
  }
  if (url.pathname.endsWith('/ScheduleDatePartial')) {
    const [date = '', month = '', year = ''] = [
      (url.searchParams.get('day') ?? '').slice(0, 2),
      (url.searchParams.get('day') ?? '').slice(2, 4),
      (url.searchParams.get('day') ?? '').slice(4),
    ];
    if (rawCalendar !== null) return text(200, rawCalendar);
    const day = `${year}-${month}-${date}`;
    return text(200, [...(SCHEDULES[day] ?? [QUIET_DAY]), ...(extras.get(day) ?? [])].join('\n'));
  }
  if (url.pathname.endsWith('/ListPartial')) {
    return text(200, medalPage(...(MEDALS.get(url.searchParams.get('rsc') ?? '') ?? [])));
  }
  return text(404, 'inconnu');
}).listen(port, '127.0.0.1', () => {
  console.log(`Faux site officiel sur http://127.0.0.1:${port}/nh/en/Comp`);
});
