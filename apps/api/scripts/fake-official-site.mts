/**
 * pnpm --filter @joj/api dev:fake-site [port]  sert un faux site officiel des résultats (pages
 * inventées, même structure HTML que le vrai) pour essayer l'import automatique sans toucher au
 * vrai site : SCRAPING_SOURCE_URL=http://127.0.0.1:4010/nh/en/Comp.
 *
 * Réglages à chaud (GET, pour un testeur ou un curl) :
 *   /__set?code=J66-FNL&medals=gold:UKR,silver:CAN,bronze:ARG   remplace les médaillés d'une unité
 *   /__fail?match=ScheduleDatePartial&day=02112026               toute URL contenant ces morceaux répond 500
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

const failing: string[][] = [];

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://fake');
  const text = (status: number, body: string) => {
    response.statusCode = status;
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(body);
  };
  if (url.pathname === '/__heal') {
    failing.length = 0;
    return text(200, 'ok');
  }
  if (url.pathname === '/__fail') {
    failing.push([...url.searchParams.values()]);
    return text(200, 'ok');
  }
  if (url.pathname === '/__set') {
    const code = url.searchParams.get('code') ?? '';
    const rows = (url.searchParams.get('medals') ?? '').split(',').map((pair) => {
      const [medal = '', noc = ''] = pair.split(':');
      return [medal.charAt(0).toUpperCase() + medal.slice(1), noc] as [string, string];
    });
    MEDALS.set(code, rows);
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
    return text(200, (SCHEDULES[`${year}-${month}-${date}`] ?? []).join('\n'));
  }
  if (url.pathname.endsWith('/ListPartial')) {
    return text(200, medalPage(...(MEDALS.get(url.searchParams.get('rsc') ?? '') ?? [])));
  }
  return text(404, 'inconnu');
}).listen(port, '127.0.0.1', () => {
  console.log(`Faux site officiel sur http://127.0.0.1:${port}/nh/en/Comp`);
});
