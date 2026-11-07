import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Podium } from '../domain/podium';
import { DrizzlePodiumRepository } from './drizzle-podium.repository';

const podium = (eventName: string, day: string) =>
  Podium.create({
    id: randomUUID(),
    eventName,
    discipline: 'Lutte',
    day,
    now: new Date('2026-11-05T18:00:00.123Z'),
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
    await repository.add(podium('Lutte filles 52 kg', '2026-11-05'));
    await repository.add(podium('Judo filles 48 kg', '2026-11-06'));
    await repository.add(podium('Lutte garçons 60 kg', '2026-11-05'));
  });

  afterAll(() => connection?.close());

  it('005-AS1: the database lists the podiums of one day', async () => {
    const found = await repository.list('2026-11-05');

    expect(found.map((item) => item.eventName).sort()).toEqual([
      'Lutte filles 52 kg',
      'Lutte garçons 60 kg',
    ]);
    expect(found.every((item) => item.correctedAt === null)).toBe(true);
    expect(await repository.list('2026-11-12')).toEqual([]);
  });

  it('005-AS2: the database lists every podium', async () => {
    expect(await repository.list()).toHaveLength(3);
  });
}

describe('DrizzlePodiumRepository.list (in-memory PGlite, migrations applied)', () => {
  contractTests(() => openDatabase({ pgliteDataDir: 'memory://' }));
});

describe.skipIf(!process.env.DATABASE_URL)('DrizzlePodiumRepository.list (real Postgres)', () => {
  contractTests(() =>
    openDatabase({ databaseUrl: process.env.DATABASE_URL, pgliteDataDir: 'memory://' }),
  );
});
