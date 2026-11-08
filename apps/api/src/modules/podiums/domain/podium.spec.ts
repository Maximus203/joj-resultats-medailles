import { describe, expect, it } from 'vitest';
import { Podium } from './podium';
import { PodiumError } from './podiums.errors';

const base = {
  id: '11111111-1111-4111-8111-111111111111',
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  now: new Date('2026-11-05T18:00:00.000Z'),
};

describe('Podium', () => {
  it('007-AS2: keeps a second bronze, and refuses one that repeats another country', () => {
    const podium = Podium.create({
      ...base,
      gold: 'UKR',
      silver: 'CAN',
      bronze: 'ARG',
      secondBronze: 'SEN',
    });

    expect(podium.secondBronze).toBe('SEN');
    expect(() =>
      Podium.create({ ...base, gold: 'UKR', silver: 'CAN', bronze: 'ARG', secondBronze: 'CAN' }),
    ).toThrow(expect.objectContaining({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT' }));
    expect(
      Podium.create({ ...base, gold: 'UKR', silver: 'CAN', bronze: 'ARG' }).secondBronze,
    ).toBeNull();
  });

  it('001-AS3: refuses a podium with a repeated country', () => {
    const repeated = [
      { gold: 'SEN', silver: 'SEN', bronze: 'FRA' },
      { gold: 'SEN', silver: 'JPN', bronze: 'SEN' },
      { gold: 'SEN', silver: 'JPN', bronze: 'JPN' },
    ];

    for (const medals of repeated) {
      const attempt = () => Podium.create({ ...base, ...medals });

      expect(attempt).toThrow(PodiumError);
      expect(attempt).toThrow(
        expect.objectContaining({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT', kind: 'BUSINESS_RULE' }),
      );
    }
  });

  it('001-AS3: accepts three different countries', () => {
    const podium = Podium.create({ ...base, gold: 'SEN', silver: 'JPN', bronze: 'FRA' });

    expect([podium.gold, podium.silver, podium.bronze]).toEqual(['SEN', 'JPN', 'FRA']);
  });
});
