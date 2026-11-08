import type { INestApplication } from '@nestjs/common';
import { scrapeStatusSchema } from '@joj/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Clock } from '../src/modules/scraping/application/clock';
import { ResultsSource } from '../src/modules/scraping/application/results-source';
import { FakeResultsSource } from '../src/modules/scraping/application/testing/fake-results-source';
import { FixedClock } from '../src/modules/scraping/application/testing/fixed-clock';
import {
  medalPage,
  quietDay,
  scheduleItem,
} from '../src/modules/scraping/application/testing/official-pages';
import { RunScrape } from '../src/modules/scraping/application/use-cases/run-scrape';
import { createTestApp } from './create-test-app';

describe('GET /api/scraping and POST /api/scraping/runs (e2e, simulated official site)', () => {
  let app: INestApplication;
  let source: FakeResultsSource;
  const http = () => request(app.getHttpServer());
  const status = async () => scrapeStatusSchema.parse((await http().get('/api/scraping')).body);
  const runAndWait = async () => {
    await http().post('/api/scraping/runs').expect(202);
    await app.get(RunScrape).whenIdle();
  };

  beforeEach(async () => {
    source = new FakeResultsSource();
    source.schedules.set(
      '2026-11-01',
      [
        scheduleItem('medal-match gold', 'J66-FNL', 'Judo', 'Men -66 kg Final'),
        scheduleItem('', 'WST-FNL-000100--', 'Wushu Taolu', 'Men&#39;s Taijiquan Combined Final A'),
        scheduleItem('medal-match gold', 'FLY-FNL', 'Swimming', 'Men 50m Butterfly Final'),
      ].join(''),
    );
    source.schedules.set('2026-11-02', quietDay);
    source.medalLists.set(
      'J66-FNL',
      medalPage(['Gold', 'UKR'], ['Silver', 'CAN'], ['Bronze', 'ARG'], ['Bronze', 'SEN']),
    );
    source.medalLists.set(
      'WST-FNL-000100--',
      medalPage(['Gold', 'HKG'], ['Silver', 'VIE'], ['Bronze', 'JPN']),
    );
    source.medalLists.set(
      'FLY-FNL',
      medalPage(['Gold', 'GRE'], ['Gold', 'POR'], ['Bronze', 'BEL']),
    );
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(ResultsSource)
        .useValue(source)
        .overrideProvider(Clock)
        .useValue(new FixedClock(new Date('2026-11-02T10:00:00.000Z'))),
    );
  });

  afterEach(() => app?.close());

  it('007-AS7: tells that the import is off and has never run, with its schedule', async () => {
    expect(await status()).toEqual({
      enabled: false,
      running: false,
      schedule: {
        timeZone: 'Africa/Dakar',
        fullTimes: ['07:00', '23:00'],
        windowStart: '08:00',
        windowEnd: '23:00',
        intervalMinutes: 15,
        staleAfterMinutes: 120,
        firstDay: '2026-11-01',
        lastDay: '2026-11-13',
      },
      nextRunAt: null,
      lastRun: null,
      recentRuns: [],
    });
  });

  it('007-AS7: shows what a run found, imported and ignored, once it is over', async () => {
    await runAndWait();

    const { lastRun, recentRuns, running } = await status();

    expect(running).toBe(false);
    expect(recentRuns).toHaveLength(1);
    expect(lastRun).toMatchObject({
      trigger: 'manual',
      status: 'success',
      startedAt: '2026-11-02T10:00:00.000Z',
      finishedAt: '2026-11-02T10:00:00.000Z',
      counts: { imported: 2, updated: 0, identical: 0, kept: 0, absent: 0, ignored: 1, errors: 0 },
    });
    expect(lastRun?.report.imported.map((event) => event.eventName).sort()).toEqual([
      'Judo – Men -66 kg',
      "Wushu Taolu – Men's Taijiquan Combined",
    ]);
    expect(lastRun?.report.exhaustiveness).toMatchObject({
      daysRead: ['2026-11-01', '2026-11-02'],
      daysFailed: [],
      finalsSeen: 3,
      finalsWithPodium: 2,
      ignored: [{ code: 'FLY-FNL', reason: 'TIED_PLACES' }],
    });
  });

  it('007-AS2: serves the imported podiums and counts the second bronze in the medal table', async () => {
    await runAndWait();

    const podiums = (await http().get('/api/podiums').expect(200)).body.items;
    const medals = (await http().get('/api/medals').expect(200)).body.items;

    expect(podiums).toHaveLength(2);
    expect(
      podiums.find((item: { eventName: string }) => item.eventName === 'Judo – Men -66 kg'),
    ).toMatchObject({ gold: 'UKR', bronze: 'ARG', secondBronze: 'SEN', correctedAt: null });
    expect(medals.find((row: { country: string }) => row.country === 'SEN')).toMatchObject({
      bronze: 1,
    });
  });

  it('007-AS1: a second run changes nothing and creates no duplicate', async () => {
    await runAndWait();
    await runAndWait();

    const { lastRun } = await status();

    expect(lastRun?.counts).toMatchObject({ imported: 0, updated: 0, identical: 2, kept: 0 });
    expect((await http().get('/api/podiums').expect(200)).body.items).toHaveLength(2);
  });

  it('007-AS4: keeps a podium the journalist corrected, and lists the difference', async () => {
    await runAndWait();
    const judo = (await http().get('/api/podiums').expect(200)).body.items.find(
      (item: { eventName: string }) => item.eventName === 'Judo – Men -66 kg',
    );
    await http()
      .put(`/api/podiums/${judo.id}`)
      .send({ gold: 'CAN', silver: 'UKR', bronze: 'ARG' })
      .expect(200);

    await runAndWait();

    const { lastRun } = await status();
    expect(lastRun?.report.kept).toMatchObject([
      {
        eventName: 'Judo – Men -66 kg',
        reason: 'CORRECTED',
        current: { gold: 'CAN' },
        source: { gold: 'UKR' },
      },
    ]);
    const after = (await http().get('/api/podiums').expect(200)).body.items.find(
      (item: { id: string }) => item.id === judo.id,
    );
    expect(after).toMatchObject({ gold: 'CAN', silver: 'UKR' });
  });

  it('007-AS4: refuses an event typed with a keyboard hyphen that the import already published', async () => {
    await runAndWait();
    const medalsBefore = (await http().get('/api/medals').expect(200)).body.items;

    const typed = await http()
      .post('/api/podiums')
      .send({
        eventName: 'judo - Men -66 kg',
        discipline: 'Judo',
        day: '2026-11-01',
        gold: 'USA',
        silver: 'CAN',
        bronze: 'ARG',
      })
      .expect(409);

    expect(typed.body).toMatchObject({ code: 'PODIUM_ALREADY_RECORDED' });
    expect((await http().get('/api/podiums?day=2026-11-01').expect(200)).body.items).toHaveLength(
      2,
    );
    expect((await http().get('/api/medals').expect(200)).body.items).toEqual(medalsBefore);
  });

  it('007-AS4: follows an official change of the second bronze and keeps the replaced version', async () => {
    await runAndWait();
    const judo = (await http().get('/api/podiums').expect(200)).body.items.find(
      (item: { eventName: string }) => item.eventName === 'Judo – Men -66 kg',
    );
    source.medalLists.set(
      'J66-FNL',
      medalPage(['Gold', 'UKR'], ['Silver', 'CAN'], ['Bronze', 'ARG'], ['Bronze', 'FRA']),
    );

    await runAndWait();

    const { lastRun } = await status();
    expect(lastRun?.report.updated).toMatchObject([
      { current: { secondBronze: 'SEN' }, source: { secondBronze: 'FRA' } },
    ]);
    const revisions = (await http().get(`/api/podiums/${judo.id}/revisions`).expect(200)).body;
    expect(revisions.items).toMatchObject([{ gold: 'UKR', bronze: 'ARG', secondBronze: 'SEN' }]);
    const after = (await http().get('/api/podiums').expect(200)).body.items.find(
      (item: { id: string }) => item.id === judo.id,
    );
    expect(after).toMatchObject({ secondBronze: 'FRA', correctedAt: null });
  });

  it('007-AS5: refuses a run requested while another is in progress (409), then recovers', async () => {
    let release: () => void = () => undefined;
    source.gate = new Promise<void>((resolve) => (release = resolve));
    await http().post('/api/scraping/runs').expect(202);

    const refused = await http().post('/api/scraping/runs').expect(409);
    expect((await status()).running).toBe(true);
    release();
    await app.get(RunScrape).whenIdle();

    expect(refused.body).toMatchObject({
      code: 'SCRAPE_ALREADY_RUNNING',
      detail: 'Un import est déjà en cours : attends qu’il se termine avant d’en lancer un autre.',
    });
    await runAndWait();
    expect((await status()).recentRuns).toHaveLength(2);
  });

  it('007-AS5: records a failed run when the site cannot be read, and keeps the podiums', async () => {
    await runAndWait();
    source.failing.add('schedule:2026-11-01');
    source.failing.add('schedule:2026-11-02');

    await runAndWait();

    const { lastRun } = await status();
    expect(lastRun).toMatchObject({ status: 'failed', counts: { imported: 0, errors: 2 } });
    expect((await http().get('/api/podiums').expect(200)).body.items).toHaveLength(2);
  });
});
