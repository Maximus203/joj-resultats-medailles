import { describe, expect, it } from 'vitest';
import { Podium } from './podium';
import { PodiumError } from './podiums.errors';

const published = () =>
  Podium.create({
    id: '11111111-1111-4111-8111-111111111111',
    eventName: 'Lutte filles 52 kg',
    discipline: 'Lutte',
    day: '2026-11-05',
    gold: 'SEN',
    silver: 'JPN',
    bronze: 'FRA',
    now: new Date('2026-11-05T18:00:00.000Z'),
  });

const later = new Date('2026-11-05T19:30:00.000Z');

describe('Podium.correct', () => {
  it('006-AS1: corrects the three countries and returns the replaced version', () => {
    const { podium, revision } = published().correct(
      { gold: 'JPN', silver: 'SEN', bronze: 'FRA' },
      later,
    );

    expect([podium.gold, podium.silver, podium.bronze]).toEqual(['JPN', 'SEN', 'FRA']);
    expect(podium.correctedAt).toEqual(later);
    expect(podium).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      eventName: 'Lutte filles 52 kg',
      day: '2026-11-05',
      createdAt: new Date('2026-11-05T18:00:00.000Z'),
    });
    expect(revision).toEqual({ gold: 'SEN', silver: 'JPN', bronze: 'FRA', correctedAt: later });
  });

  it('006-AS2: refuses a repeated country', () => {
    const original = published();

    const attempt = () => original.correct({ gold: 'SEN', silver: 'JPN', bronze: 'SEN' }, later);

    expect(attempt).toThrow(PodiumError);
    expect(attempt).toThrow(
      expect.objectContaining({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT', kind: 'BUSINESS_RULE' }),
    );
    expect(original).toMatchObject({
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: null,
    });
  });

  it('006-AS5: an identical correction changes nothing', () => {
    const original = published();

    const { podium, revision } = original.correct(
      { gold: 'SEN', silver: 'JPN', bronze: 'FRA' },
      later,
    );

    expect(revision).toBeNull();
    expect(podium).toBe(original);
    expect(podium.correctedAt).toBeNull();
  });
});
