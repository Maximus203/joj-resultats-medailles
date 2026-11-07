import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Podium } from '../domain/podium';
import { DrizzlePodiumRepository } from './drizzle-podium.repository';
import { podiums } from './podiums.schema';

const podium = (eventName: string, medals: { gold: string; silver: string; bronze: string }) =>
  Podium.create({
    id: randomUUID(),
    eventName,
    discipline: 'Lutte',
    day: '2026-11-05',
    now: new Date('2026-11-05T18:00:00.123Z'),
    ...medals,
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

  it('001-AS2: the database refuses a second podium for the same event, written differently', async () => {
    await repository.add(
      podium('Lutte garçons 60 kg', { gold: 'SEN', silver: 'JPN', bronze: 'FRA' }),
    );

    await expect(
      repository.add(
        podium(' LUTTE  garçons 60 KG', { gold: 'USA', silver: 'CHN', bronze: 'BRA' }),
      ),
    ).rejects.toMatchObject({ code: 'PODIUM_ALREADY_RECORDED' });

    const rows = await connection.db.select().from(podiums);
    const wrestling = rows.filter((row) => row.eventKey === 'lutte garçons 60 kg');
    expect(wrestling).toHaveLength(1);
    expect(wrestling[0]).toMatchObject({
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      day: '2026-11-05',
    });
  });

  it('001-AS3: the database refuses a repeated country even if the domain is bypassed', async () => {
    const insert = connection.db.insert(podiums).values({
      id: randomUUID(),
      eventName: 'Judo filles 48 kg',
      eventKey: 'judo filles 48 kg',
      discipline: 'Judo',
      day: '2026-11-06',
      gold: 'SEN',
      silver: 'SEN',
      bronze: 'FRA',
      createdAt: new Date(),
    });

    const error = await insert.then(
      () => null,
      (reason: unknown) => reason,
    );

    expect(rootCause(error)).toMatchObject({
      code: '23514',
      constraint: 'podiums_countries_distinct',
    });
  });
}

/** Drizzle enveloppe l'erreur du driver : on remonte la chaîne `cause` jusqu'à Postgres. */
function rootCause(error: unknown): unknown {
  let current = error;
  while (current instanceof Error && current.cause) current = current.cause;
  return current;
}

describe('DrizzlePodiumRepository (in-memory PGlite, migrations applied)', () => {
  contractTests(() => openDatabase({ pgliteDataDir: 'memory://' }));
});

describe.skipIf(!process.env.DATABASE_URL)('DrizzlePodiumRepository (real Postgres)', () => {
  contractTests(() =>
    openDatabase({ databaseUrl: process.env.DATABASE_URL, pgliteDataDir: 'memory://' }),
  );
});
