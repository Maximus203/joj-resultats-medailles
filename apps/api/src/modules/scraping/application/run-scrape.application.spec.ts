import { Logger } from '@nestjs/common';
import { beforeAll, describe, expect, it } from 'vitest';
import { podiumIdOf } from '../domain/official-results';
import type { StoredPodium } from '../domain/podium-reconciliation';
import { RunScrape } from './use-cases/run-scrape';
import { testSettings } from './testing/settings';
import type { ScrapingSettings } from './scraping-settings';
import { FakeResultsSource } from './testing/fake-results-source';
import { FixedClock } from './testing/fixed-clock';
import { InMemoryImportedPodiumRepository } from './testing/in-memory-imported-podium.repository';
import { InMemoryScrapeRunRepository } from './testing/in-memory-scrape-run.repository';
import { medalPage, quietDay, scheduleItem } from './testing/official-pages';

const SETTINGS: ScrapingSettings = testSettings();
const NOW = '2026-11-02T10:00:00.000Z';

const JUDO = 'Judo – Men -66 kg';
const SWIM = "Swimming – Women's 50m Freestyle";
const WRESTLING = 'Beach Wrestling – Men 80kg';

function stored(eventName: string, patch: Partial<StoredPodium>): StoredPodium {
  const eventKey = eventName.toLowerCase();
  return {
    id: podiumIdOf(eventKey),
    eventKey,
    eventName,
    day: '2026-11-01',
    gold: 'AAA',
    silver: 'BBB',
    bronze: 'CCC',
    secondBronze: null,
    correctedAt: null,
    ...patch,
  };
}

function setup(initial: StoredPodium[] = []) {
  const source = new FakeResultsSource();
  source.schedules.set(
    '2026-11-01',
    [
      scheduleItem('medal-match gold', 'J66-FNL', 'Judo', 'Men -66 kg Final'),
      scheduleItem('medal-match gold', 'S50-FNL', 'Swimming', 'Women&#39;s 50m Freestyle Final'),
      scheduleItem(
        'medal-match gold',
        'W80-FNL',
        'Beach Wrestling',
        'Men 80kg Finals Gold Medal Match #69',
      ),
      scheduleItem('medal-match gold', 'LATER-FNL', 'Badminton', 'Men Final', 'Scheduled'),
    ].join(''),
  );
  source.schedules.set('2026-11-02', quietDay);
  source.medalLists.set(
    'J66-FNL',
    medalPage(['Gold', 'UKR'], ['Silver', 'CAN'], ['Bronze', 'ARG'], ['Bronze', 'SEN']),
  );
  source.medalLists.set(
    'S50-FNL',
    medalPage(['Gold', 'GBR'], ['Silver', 'ITA'], ['Bronze', 'FRA']),
  );
  source.medalLists.set(
    'W80-FNL',
    medalPage(['Gold', 'SEN'], ['Silver', 'AZE'], ['Bronze', 'IRI']),
  );
  const podiums = new InMemoryImportedPodiumRepository(initial);
  const runs = new InMemoryScrapeRunRepository();
  const clock = new FixedClock(new Date(NOW));
  return {
    source,
    podiums,
    runs,
    clock,
    run: new RunScrape(source, podiums, runs, clock, SETTINGS),
  };
}

// Les journaux de l'import sont vérifiés en e2e et au playbook : ici, silence.
beforeAll(() => Logger.overrideLogger(false));

describe('RunScrape', () => {
  it('007-AS1: imports the finished finals once, and a second run changes nothing', async () => {
    const { run, podiums, source } = setup();

    const first = await run.execute('manual');
    const second = await run.execute('manual');

    expect(first.status).toBe('success');
    expect(first.report.imported.map((event) => event.eventName).sort()).toEqual(
      [JUDO, SWIM, WRESTLING].sort(),
    );
    expect(await podiums.findAll()).toHaveLength(3);
    expect(second.report).toMatchObject({ imported: [], updated: [], kept: [], identical: 3 });
    // Le calendrier du 3 novembre et des jours suivants n'est pas lu : ils n'ont pas eu lieu.
    expect(source.requests.filter((request) => request.startsWith('schedule:'))).toEqual([
      'schedule:2026-11-01',
      'schedule:2026-11-02',
      'schedule:2026-11-01',
      'schedule:2026-11-02',
    ]);
  });

  it('007-AS4: leaves a corrected or hand-typed podium alone, follows an official correction', async () => {
    const { run, podiums, clock } = setup([
      stored(WRESTLING, { gold: 'IRI', silver: 'AZE', bronze: 'SEN', correctedAt: new Date(NOW) }),
      { ...stored(SWIM, { gold: 'USA', silver: 'ITA', bronze: 'FRA' }), id: 'not-the-import-id' },
      stored(JUDO, { gold: 'FRA', silver: 'CAN', bronze: 'ARG' }),
      stored('Judo – Women -52 kg', { day: '2026-11-01' }),
      stored('Judo – Women -57 kg', { day: '2026-11-10' }),
    ]);
    clock.set('2026-11-02T22:00:00.000Z');

    const result = await run.execute('scheduled');

    const all = await podiums.findAll();
    expect(all.filter((podium) => podium.eventKey === SWIM.toLowerCase())).toHaveLength(1);
    expect(all).toHaveLength(5);
    expect(all.find((podium) => podium.eventName === WRESTLING)).toMatchObject({ gold: 'IRI' });
    expect(all.find((podium) => podium.eventName === SWIM)).toMatchObject({ gold: 'USA' });
    expect(all.find((podium) => podium.eventName === JUDO)).toMatchObject({
      gold: 'UKR',
      secondBronze: 'SEN',
    });
    expect(result.report.kept).toMatchObject([
      { eventName: SWIM, reason: 'MANUAL', current: { gold: 'USA' }, source: { gold: 'GBR' } },
      {
        eventName: WRESTLING,
        reason: 'CORRECTED',
        current: { gold: 'IRI' },
        source: { gold: 'SEN' },
      },
    ]);
    expect(result.report.updated).toMatchObject([
      { eventName: JUDO, outcome: 'updated', current: { gold: 'FRA' }, source: { gold: 'UKR' } },
    ]);
    expect(podiums.revisions).toEqual([
      {
        podiumId: podiumIdOf(JUDO.toLowerCase()),
        revision: {
          gold: 'FRA',
          silver: 'CAN',
          bronze: 'ARG',
          correctedAt: new Date('2026-11-02T22:00:00.000Z'),
        },
      },
    ]);
    // Un podium d'un jour lu que le site ne montre pas est signalé ; celui d'un jour non lu, non.
    expect(result.report.absentFromSource).toEqual([
      { eventName: 'Judo – Women -52 kg', day: '2026-11-01' },
    ]);
  });

  it('007-AS4: does not duplicate an event typed by hand with a plain hyphen or another case', async () => {
    const { run, podiums } = setup([
      {
        ...stored('judo - men -66 KG', { gold: 'USA', silver: 'CAN', bronze: 'ARG' }),
        id: 'typed-by-hand',
      },
    ]);

    const result = await run.execute('manual');

    const all = await podiums.findAll();
    expect(all.filter((podium) => /judo/i.test(podium.eventName))).toHaveLength(1);
    expect(all.find((podium) => /judo/i.test(podium.eventName))).toMatchObject({ gold: 'USA' });
    expect(result.report.kept).toMatchObject([{ reason: 'MANUAL', source: { gold: 'UKR' } }]);
    expect(result.report.imported.map((event) => event.eventName)).not.toContain(JUDO);
    expect(result.report.absentFromSource).toEqual([]);
  });

  it('007-AS4: keeps the replaced second bronze when only the second bronze changes', async () => {
    const { run, podiums, clock } = setup([
      stored(JUDO, { gold: 'UKR', silver: 'CAN', bronze: 'ARG', secondBronze: 'FRA' }),
    ]);
    clock.set('2026-11-02T22:00:00.000Z');

    const result = await run.execute('scheduled');

    expect(result.report.updated).toMatchObject([
      { eventName: JUDO, current: { secondBronze: 'FRA' }, source: { secondBronze: 'SEN' } },
    ]);
    expect(podiums.revisions).toEqual([
      {
        podiumId: podiumIdOf(JUDO.toLowerCase()),
        revision: {
          gold: 'UKR',
          silver: 'CAN',
          bronze: 'ARG',
          secondBronze: 'FRA',
          correctedAt: new Date('2026-11-02T22:00:00.000Z'),
        },
      },
    ]);
  });

  it('007-AS5: a bad day or page stops nothing, keeps the stored data, and lists its errors', async () => {
    const { run, podiums, source, runs } = setup([stored(JUDO, { gold: 'FRA' })]);
    source.failing.add('schedule:2026-11-02');
    source.failing.add('medals:S50-FNL');

    const result = await run.execute('manual');

    expect(result.status).toBe('partial');
    expect(result.report.imported.map((event) => event.eventName).sort()).toEqual([WRESTLING]);
    expect(result.report.exhaustiveness).toMatchObject({
      daysRead: ['2026-11-01'],
      daysFailed: ['2026-11-02'],
      finalsSeen: 3,
      finalsWithPodium: 2,
      ignored: [{ code: 'S50-FNL', reason: 'FETCH_FAILED' }],
    });
    expect(result.report.errors).toHaveLength(2);
    expect(runs.runs[0]?.id).toBe(result.id);
    expect((await podiums.findAll()).find((podium) => podium.eventName === SWIM)).toBeUndefined();
  });

  it('007-AS5: reports a failed run, and keeps every podium, when no day can be read', async () => {
    const { run, podiums, source } = setup([stored(JUDO, { gold: 'FRA' })]);
    source.failing.add('schedule:2026-11-01');
    source.failing.add('schedule:2026-11-02');

    const result = await run.execute('manual');

    expect(result.status).toBe('failed');
    expect(result.report.absentFromSource).toEqual([]);
    expect(await podiums.findAll()).toMatchObject([{ eventName: JUDO, gold: 'FRA' }]);
  });

  it('007-AS5: reports a failed run, not a success, when the site answers with a page of another shape', async () => {
    const { run, podiums, source } = setup([stored(JUDO, { gold: 'FRA' })]);
    source.schedules.set('2026-11-01', '<html>Maintenance</html>');
    source.schedules.set('2026-11-02', '');

    const result = await run.execute('manual');

    expect(result.status).toBe('failed');
    expect(result.report.errors).toHaveLength(2);
    expect(result.report.errors[0]).toMatch(/structure/);
    expect(result.report.absentFromSource).toEqual([]);
    expect(await podiums.findAll()).toMatchObject([{ eventName: JUDO, gold: 'FRA' }]);
  });

  it('007-AS5: refuses a second run while one is in progress (409), then allows the next', async () => {
    const { run, source } = setup();
    let release: () => void = () => undefined;
    source.gate = new Promise<void>((resolve) => (release = resolve));

    const first = run.execute('scheduled');

    expect(run.running).toBe(true);
    expect(() => run.execute('manual')).toThrow(
      expect.objectContaining({ code: 'SCRAPE_ALREADY_RUNNING', kind: 'CONFLICT' }),
    );
    release();
    await first;
    expect(run.running).toBe(false);
    await expect(run.execute('manual')).resolves.toMatchObject({ status: 'success' });
  });
});
