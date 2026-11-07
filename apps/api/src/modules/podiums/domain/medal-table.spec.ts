import { describe, expect, it } from 'vitest';
import { buildMedalTable } from './medal-table';

const podium = (gold: string, silver: string, bronze: string) => ({ gold, silver, bronze });

describe('buildMedalTable', () => {
  it('004-AS1: counts and sorts medals by gold, then silver, then bronze', () => {
    const table = buildMedalTable([
      podium('SEN', 'JPN', 'FRA'),
      podium('JPN', 'SEN', 'USA'),
      podium('SEN', 'FRA', 'JPN'),
    ]);

    expect(table).toEqual([
      { rank: 1, country: 'SEN', gold: 2, silver: 1, bronze: 0 },
      { rank: 2, country: 'JPN', gold: 1, silver: 1, bronze: 1 },
      { rank: 3, country: 'FRA', gold: 0, silver: 1, bronze: 1 },
      { rank: 4, country: 'USA', gold: 0, silver: 0, bronze: 1 },
    ]);
  });

  it('004-AS2: ranks tied countries together and skips the following rank', () => {
    const table = buildMedalTable([podium('SEN', 'FRA', 'USA'), podium('JPN', 'FRA', 'USA')]);

    expect(table.map(({ rank, country }) => [rank, country])).toEqual([
      [1, 'JPN'],
      [1, 'SEN'],
      [3, 'FRA'],
      [4, 'USA'],
    ]);
  });

  it('004-AS2: ranks 1, 2, 2, 4 when the second place is shared', () => {
    const table = buildMedalTable([
      podium('SEN', 'USA', 'CHN'),
      podium('SEN', 'USA', 'CHN'),
      podium('JPN', 'USA', 'CHN'),
      podium('FRA', 'USA', 'CHN'),
    ]);

    expect(table.map((row) => row.rank)).toEqual([1, 2, 2, 4, 5]);
    expect(table.map((row) => row.country)).toEqual(['SEN', 'FRA', 'JPN', 'USA', 'CHN']);
  });

  it('004-AS3: returns an empty table without podiums', () => {
    expect(buildMedalTable([])).toEqual([]);
  });
});
