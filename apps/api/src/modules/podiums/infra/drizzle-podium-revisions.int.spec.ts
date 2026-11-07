import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Podium } from '../domain/podium';
import { DrizzlePodiumRepository } from './drizzle-podium.repository';

const podium = (eventName: string) =>
  Podium.create({
    id: randomUUID(),
    eventName,
    discipline: 'Lutte',
    day: '2026-11-05',
    now: new Date('2026-11-05T18:00:00.000Z'),
    gold: 'SEN',
    silver: 'JPN',
    bronze: 'FRA',
  });

/** Le même contrat, sur PGlite (toujours) puis sur un vrai Postgres (si DATABASE_URL existe). */
function contractTests(open: () => DatabaseConnection) {
  let connection: DatabaseConnection;
  let repository: DrizzlePodiumRepository;

  beforeAll(async () => {
    connection = open();
    await connection.migrate();
    repository = new DrizzlePodiumRepository(connection.db);
  });

  afterAll(() => connection?.close());

  it('006-AS4: the database keeps replaced versions with their date, most recent first', async () => {
    const original = podium('Lutte filles 52 kg');
    await repository.add(original);
    const first = original.correct(
      { gold: 'JPN', silver: 'SEN', bronze: 'FRA' },
      new Date('2026-11-05T19:00:00.000Z'),
    );
    await repository.saveCorrection(first.podium, first.revision);
    const second = first.podium.correct(
      { gold: 'JPN', silver: 'FRA', bronze: 'SEN' },
      new Date('2026-11-05T20:00:00.000Z'),
    );
    await repository.saveCorrection(second.podium, second.revision);

    const stored = await repository.findById(original.id);
    const revisions = await repository.revisionsOf(original.id);

    expect(stored).toMatchObject({ gold: 'JPN', silver: 'FRA', bronze: 'SEN' });
    expect(stored?.correctedAt).toEqual(new Date('2026-11-05T20:00:00.000Z'));
    expect(revisions).toEqual([
      {
        gold: 'JPN',
        silver: 'SEN',
        bronze: 'FRA',
        correctedAt: new Date('2026-11-05T20:00:00.000Z'),
      },
      {
        gold: 'SEN',
        silver: 'JPN',
        bronze: 'FRA',
        correctedAt: new Date('2026-11-05T19:00:00.000Z'),
      },
    ]);
  });

  it('006-AS4: the database finds no podium nor revision for an unknown id', async () => {
    const unknownId = randomUUID();

    expect(await repository.findById(unknownId)).toBeNull();
    expect(await repository.revisionsOf(unknownId)).toEqual([]);
  });

  it('006-AS1: a correction is saved with its replaced version, or not at all', async () => {
    const original = podium('Judo filles 48 kg');
    await repository.add(original);
    const { podium: corrected } = original.correct(
      { gold: 'JPN', silver: 'SEN', bronze: 'FRA' },
      new Date('2026-11-05T19:00:00.000Z'),
    );
    const brokenRevision = {
      gold: 'SENEGAL',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: new Date('2026-11-05T19:00:00.000Z'),
    };

    await expect(repository.saveCorrection(corrected, brokenRevision)).rejects.toThrow(
      /failed query/i,
    );

    expect(await repository.findById(original.id)).toMatchObject({
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: null,
    });
    expect(await repository.revisionsOf(original.id)).toEqual([]);
  });
}

describe('DrizzlePodiumRepository revisions (in-memory PGlite, migrations applied)', () => {
  contractTests(() => openDatabase({ pgliteDataDir: 'memory://' }));
});

describe.skipIf(!process.env.DATABASE_URL)(
  'DrizzlePodiumRepository revisions (real Postgres)',
  () => {
    contractTests(() =>
      openDatabase({ databaseUrl: process.env.DATABASE_URL, pgliteDataDir: 'memory://' }),
    );
  },
);
