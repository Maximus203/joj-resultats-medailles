import { beforeEach, describe, expect, it } from 'vitest';
import { PodiumError } from '../domain/podiums.errors';
import { InMemoryPodiumRepository } from './testing/in-memory-podium.repository';
import { RecordPodium } from './use-cases/record-podium';

const wrestling = {
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
};

describe('RecordPodium', () => {
  let podiums: InMemoryPodiumRepository;
  let recordPodium: RecordPodium;

  beforeEach(() => {
    podiums = new InMemoryPodiumRepository();
    recordPodium = new RecordPodium(podiums);
  });

  it('001-AS1: records a podium with its event, discipline, day and three medallists', async () => {
    const podium = await recordPodium.execute({ ...wrestling, eventName: '  Lutte filles 52 kg ' });

    expect(podium).toMatchObject(wrestling);
    expect(podium.id).toEqual(expect.any(String));
    expect(podium.createdAt).toBeInstanceOf(Date);
    expect(podiums.all()).toHaveLength(1);
  });

  it('001-AS2: refuses a second podium for the same event, written differently', async () => {
    await recordPodium.execute(wrestling);

    const attempt = recordPodium.execute({
      ...wrestling,
      eventName: ' LUTTE  filles   52 KG',
      gold: 'USA',
      silver: 'CHN',
      bronze: 'BRA',
    });

    await expect(attempt).rejects.toBeInstanceOf(PodiumError);
    await expect(attempt).rejects.toMatchObject({ code: 'PODIUM_ALREADY_RECORDED' });
    expect(podiums.all()).toHaveLength(1);
    expect(podiums.all()[0]).toMatchObject({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
  });
});
