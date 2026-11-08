import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Podium } from '../../podiums/domain/podium';
import { DrizzlePodiumRepository } from '../../podiums/infra/drizzle-podium.repository';
import type { PodiumDraft } from '../domain/official-results';
import { podiumIdOf } from '../domain/official-results';
import type { ScrapeRun } from '../domain/scrape-run';
import { DrizzleImportedPodiumRepository } from './drizzle-imported-podium.repository';
import { DrizzleScrapeRunRepository } from './drizzle-scrape-run.repository';

const draft = (eventName: string, patch: Partial<PodiumDraft> = {}): PodiumDraft => ({
  id: podiumIdOf(eventName.toLowerCase()),
  eventName,
  eventKey: eventName.toLowerCase(),
  discipline: 'Judo',
  day: '2026-11-01',
  gold: 'UKR',
  silver: 'CAN',
  bronze: 'ARG',
  secondBronze: 'SEN',
  ...patch,
});

const run = (startedAt: string, status: ScrapeRun['status']): ScrapeRun => ({
  id: randomUUID(),
  trigger: 'scheduled',
  kind: 'full',
  status,
  startedAt: new Date(startedAt),
  finishedAt: new Date(startedAt),
  report: {
    imported: [{ eventName: 'Judo – Men -66 kg', day: '2026-11-01' }],
    updated: [],
    kept: [],
    identical: 2,
    absentFromSource: [],
    exhaustiveness: {
      daysRead: ['2026-11-01'],
      daysFailed: [],
      finalsSeen: 3,
      finalsWithPodium: 3,
      finalsKnown: 0,
      ignored: [
        {
          day: '2026-11-01',
          discipline: 'Swimming',
          competition: 'Men 50m Butterfly Final',
          code: 'SWMM50MBA',
          reason: 'TIED_PLACES',
          detail: 'égalité',
        },
      ],
    },
    errors: [],
  },
});

describe('Scraping repositories (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let imported: DrizzleImportedPodiumRepository;
  let podiums: DrizzlePodiumRepository;
  let runs: DrizzleScrapeRunRepository;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    imported = new DrizzleImportedPodiumRepository(connection.db);
    podiums = new DrizzlePodiumRepository(connection.db);
    runs = new DrizzleScrapeRunRepository(connection.db);
  });

  afterAll(() => connection?.close());

  it('007-AS4: inserts a draft under its stable id and refuses the same event twice', async () => {
    const judo = draft('Judo – Men -66 kg');
    await imported.insert(judo, new Date('2026-11-02T10:00:00.000Z'));

    await expect(imported.insert(judo, new Date())).rejects.toThrow(/Failed query/);
    const all = await imported.findAll();
    expect(all.filter((podium) => podium.eventKey === judo.eventKey)).toEqual([
      {
        id: podiumIdOf(judo.eventKey),
        eventKey: judo.eventKey,
        eventName: judo.eventName,
        day: '2026-11-01',
        gold: 'UKR',
        silver: 'CAN',
        bronze: 'ARG',
        secondBronze: 'SEN',
        correctedAt: null,
      },
    ]);
  });

  it('007-AS4: replaces the medals and keeps each replaced version', async () => {
    const event = draft('Judo – Men -81 kg', { secondBronze: null });
    await imported.insert(event, new Date());
    const correctedAt = new Date('2026-11-02T22:00:00.000Z');

    await imported.update(
      event.id,
      { ...event, gold: 'FRA' },
      {
        gold: 'UKR',
        silver: 'CAN',
        bronze: 'ARG',
        correctedAt,
      },
    );
    await imported.update(
      event.id,
      { ...event, gold: 'FRA', secondBronze: 'SEN' },
      {
        gold: 'FRA',
        silver: 'CAN',
        bronze: 'ARG',
        correctedAt: new Date('2026-11-02T23:00:00.000Z'),
      },
    );

    expect((await imported.findAll()).find((podium) => podium.id === event.id)).toMatchObject({
      gold: 'FRA',
      secondBronze: 'SEN',
      correctedAt: null,
    });
    expect(await podiums.revisionsOf(event.id)).toEqual([
      {
        gold: 'FRA',
        silver: 'CAN',
        bronze: 'ARG',
        correctedAt: new Date('2026-11-02T23:00:00.000Z'),
      },
      { gold: 'UKR', silver: 'CAN', bronze: 'ARG', correctedAt },
    ]);
  });

  it('007-AS4: keeps the replaced second bronze in the revision', async () => {
    const event = draft('Judo – Women -48 kg', { secondBronze: 'SEN' });
    await imported.insert(event, new Date());
    const correctedAt = new Date('2026-11-03T22:00:00.000Z');

    await imported.update(
      event.id,
      { ...event, secondBronze: 'ITA' },
      {
        gold: 'UKR',
        silver: 'CAN',
        bronze: 'ARG',
        secondBronze: 'SEN',
        correctedAt,
      },
    );

    expect(await podiums.revisionsOf(event.id)).toEqual([
      { gold: 'UKR', silver: 'CAN', bronze: 'ARG', secondBronze: 'SEN', correctedAt },
    ]);
  });

  it('007-AS4: shows hand-typed podiums (random id) and corrected ones as such', async () => {
    const manual = Podium.create({
      id: randomUUID(),
      eventName: 'Lutte filles 52 kg',
      discipline: 'Lutte',
      day: '2026-11-05',
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      now: new Date(),
    });
    await podiums.add(manual);
    const { podium, revision } = manual.correct(
      { gold: 'JPN', silver: 'SEN', bronze: 'FRA' },
      new Date('2026-11-05T19:00:00.000Z'),
    );
    await podiums.saveCorrection(podium, revision);

    const stored = (await imported.findAll()).find((row) => row.id === manual.id);

    expect(stored).toMatchObject({
      eventKey: 'lutte filles 52 kg',
      gold: 'JPN',
      correctedAt: new Date('2026-11-05T19:00:00.000Z'),
    });
    expect(stored?.id).not.toBe(podiumIdOf(stored?.eventKey ?? ''));
  });

  it('007-AS7: stores a run with its report, newest first, and finds the last one that worked', async () => {
    await runs.add(run('2026-11-02T23:00:00.000Z', 'success'));
    const latest = run('2026-11-03T23:00:00.000Z', 'failed');
    await runs.add(latest);

    const [first, second] = await runs.latest(10);

    expect(first).toEqual(latest);
    expect(second?.report.exhaustiveness.ignored[0]?.reason).toBe('TIED_PLACES');
    expect(await runs.latest(1)).toHaveLength(1);
    expect(await runs.lastSucceededAt()).toEqual(new Date('2026-11-02T23:00:00.000Z'));
  });

  it('007-AS7: has no last success before any run worked', async () => {
    const empty = openDatabase({ pgliteDataDir: 'memory://' });
    await empty.migrate();
    const repository = new DrizzleScrapeRunRepository(empty.db);

    expect(await repository.lastSucceededAt()).toBeNull();
    expect(await repository.latest(5)).toEqual([]);
    await empty.close();
  });

  it('008-AS5: tells full from light runs, and a skipped run from one that really ran', async () => {
    const fresh = openDatabase({ pgliteDataDir: 'memory://' });
    await fresh.migrate();
    const repository = new DrizzleScrapeRunRepository(fresh.db);
    const full = { ...run('2026-11-03T07:00:00.000Z', 'success'), kind: 'full' as const };
    const light = { ...run('2026-11-03T08:00:00.000Z', 'success'), kind: 'incremental' as const };
    const skipped = { ...run('2026-11-03T08:15:00.000Z', 'skipped'), kind: 'incremental' as const };
    for (const item of [full, light, skipped]) await repository.add(item);

    expect(await repository.lastAttemptAt()).toEqual(skipped.startedAt);
    expect(await repository.lastStartedAt('incremental')).toEqual(light.startedAt);
    expect(await repository.lastStartedAt('full')).toEqual(full.startedAt);
    expect(await repository.lastSucceededAt()).toEqual(light.startedAt);
    expect((await repository.latestFull())?.id).toBe(full.id);
    expect((await repository.latest(1))[0]).toMatchObject({
      kind: 'incremental',
      status: 'skipped',
    });
    await fresh.close();
  });
});
