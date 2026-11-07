import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryPodiumRepository } from './testing/in-memory-podium.repository';
import { ListPodiums } from './use-cases/list-podiums';
import { RecordPodium } from './use-cases/record-podium';

const event = (eventName: string, day: string) => ({
  eventName,
  discipline: 'Lutte',
  day,
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
});

describe('ListPodiums', () => {
  let recordPodium: RecordPodium;
  let listPodiums: ListPodiums;
  let clock = 0;

  /** Enregistre un podium une seconde après le précédent. */
  const record = (eventName: string, day: string) => {
    vi.setSystemTime(new Date('2026-11-05T18:00:00.000Z').getTime() + clock++ * 1000);
    return recordPodium.execute(event(eventName, day));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    clock = 0;
    const podiums = new InMemoryPodiumRepository();
    recordPodium = new RecordPodium(podiums);
    listPodiums = new ListPodiums(podiums);
  });

  afterEach(() => vi.useRealTimers());

  it('005-AS1: lists the podiums of one day', async () => {
    await record('Lutte filles 52 kg', '2026-11-05');
    await record('Judo filles 48 kg', '2026-11-06');
    await record('Lutte garçons 60 kg', '2026-11-05');

    const podiums = await listPodiums.execute({ day: '2026-11-05' });

    expect(podiums.map((podium) => podium.eventName)).toEqual([
      'Lutte garçons 60 kg',
      'Lutte filles 52 kg',
    ]);
    expect(podiums[0]).toMatchObject({
      discipline: 'Lutte',
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: null,
    });
  });

  it('005-AS2: lists every podium without a day', async () => {
    await record('Lutte filles 52 kg', '2026-11-05');
    await record('Judo filles 48 kg', '2026-11-06');

    const podiums = await listPodiums.execute({});

    expect(podiums).toHaveLength(2);
  });

  it('005-AS3: lists the most recently recorded first', async () => {
    await record('Lutte filles 52 kg', '2026-11-05');
    await record('Judo filles 48 kg', '2026-11-05');

    const podiums = await listPodiums.execute({});

    expect(podiums.map((podium) => podium.eventName)).toEqual([
      'Judo filles 48 kg',
      'Lutte filles 52 kg',
    ]);
  });

  it('005-AS3: breaks a tie on the recording date by event name', async () => {
    vi.setSystemTime(new Date('2026-11-05T18:00:00.000Z'));
    await recordPodium.execute(event('Lutte filles 52 kg', '2026-11-05'));
    await recordPodium.execute(event('Judo filles 48 kg', '2026-11-05'));

    const podiums = await listPodiums.execute({});

    expect(podiums.map((podium) => podium.eventName)).toEqual([
      'Judo filles 48 kg',
      'Lutte filles 52 kg',
    ]);
  });

  it('005-AS4: lists nothing for a day without podium', async () => {
    await record('Lutte filles 52 kg', '2026-11-05');

    expect(await listPodiums.execute({ day: '2026-11-12' })).toEqual([]);
  });
});
