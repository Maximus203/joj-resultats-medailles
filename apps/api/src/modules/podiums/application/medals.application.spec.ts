import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryPodiumRepository } from './testing/in-memory-podium.repository';
import { GetMedalTable } from './use-cases/get-medal-table';
import { RecordPodium } from './use-cases/record-podium';

const event = (eventName: string, gold: string, silver: string, bronze: string) => ({
  eventName,
  discipline: 'Lutte',
  day: '2026-11-05',
  gold,
  silver,
  bronze,
});

describe('GetMedalTable', () => {
  let recordPodium: RecordPodium;
  let getMedalTable: GetMedalTable;

  beforeEach(() => {
    const podiums = new InMemoryPodiumRepository();
    recordPodium = new RecordPodium(podiums);
    getMedalTable = new GetMedalTable(podiums);
  });

  it('004-AS1: builds the table from recorded podiums', async () => {
    await recordPodium.execute(event('Lutte filles 52 kg', 'SEN', 'JPN', 'FRA'));
    await recordPodium.execute(event('Lutte filles 57 kg', 'JPN', 'SEN', 'USA'));
    await recordPodium.execute(event('Lutte garçons 60 kg', 'SEN', 'FRA', 'JPN'));

    const table = await getMedalTable.execute();

    expect(table).toEqual([
      { rank: 1, country: 'SEN', gold: 2, silver: 1, bronze: 0 },
      { rank: 2, country: 'JPN', gold: 1, silver: 1, bronze: 1 },
      { rank: 3, country: 'FRA', gold: 0, silver: 1, bronze: 1 },
      { rank: 4, country: 'USA', gold: 0, silver: 0, bronze: 1 },
    ]);
  });

  it('004-AS3: returns an empty table when nothing is recorded', async () => {
    expect(await getMedalTable.execute()).toEqual([]);
  });
});
