import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PodiumError } from '../domain/podiums.errors';
import { InMemoryPodiumRepository } from './testing/in-memory-podium.repository';
import { CorrectPodium } from './use-cases/correct-podium';
import { ListPodiumRevisions } from './use-cases/list-podium-revisions';
import { RecordPodium } from './use-cases/record-podium';

const wrestling = {
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
};
const unknownId = '99999999-9999-4999-8999-999999999999';

describe('CorrectPodium and ListPodiumRevisions', () => {
  let podiums: InMemoryPodiumRepository;
  let recordPodium: RecordPodium;
  let correctPodium: CorrectPodium;
  let listRevisions: ListPodiumRevisions;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T18:00:00.000Z'));
    podiums = new InMemoryPodiumRepository();
    recordPodium = new RecordPodium(podiums);
    correctPodium = new CorrectPodium(podiums);
    listRevisions = new ListPodiumRevisions(podiums);
  });

  afterEach(() => vi.useRealTimers());

  it('006-AS1: records a correction', async () => {
    const { id } = await recordPodium.execute(wrestling);
    vi.setSystemTime(new Date('2026-11-05T19:00:00.000Z'));

    const corrected = await correctPodium.execute({
      id,
      gold: 'JPN',
      silver: 'SEN',
      bronze: 'FRA',
    });

    expect(corrected).toMatchObject({ gold: 'JPN', silver: 'SEN', bronze: 'FRA' });
    expect(corrected.correctedAt).toEqual(new Date('2026-11-05T19:00:00.000Z'));
    expect(podiums.all()[0]).toMatchObject({ gold: 'JPN', silver: 'SEN', bronze: 'FRA' });
  });

  it('006-AS1: refuses a repeated country and leaves the podium unchanged', async () => {
    const { id } = await recordPodium.execute(wrestling);

    const attempt = correctPodium.execute({ id, gold: 'SEN', silver: 'JPN', bronze: 'SEN' });

    await expect(attempt).rejects.toMatchObject({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT' });
    expect(podiums.all()[0]).toMatchObject({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    expect(await listRevisions.execute(id)).toEqual([]);
  });

  it('006-AS3: refuses an unknown podium', async () => {
    const correction = correctPodium.execute({
      id: unknownId,
      gold: 'JPN',
      silver: 'SEN',
      bronze: 'FRA',
    });
    const revisions = listRevisions.execute(unknownId);

    await expect(correction).rejects.toBeInstanceOf(PodiumError);
    await expect(correction).rejects.toMatchObject({ code: 'PODIUM_NOT_FOUND' });
    await expect(revisions).rejects.toMatchObject({ code: 'PODIUM_NOT_FOUND' });
  });

  it('006-AS4: lists replaced versions, most recent first', async () => {
    const { id } = await recordPodium.execute(wrestling);
    vi.setSystemTime(new Date('2026-11-05T19:00:00.000Z'));
    await correctPodium.execute({ id, gold: 'JPN', silver: 'SEN', bronze: 'FRA' });
    vi.setSystemTime(new Date('2026-11-05T20:00:00.000Z'));
    await correctPodium.execute({ id, gold: 'JPN', silver: 'FRA', bronze: 'SEN' });

    const revisions = await listRevisions.execute(id);

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

  it('006-AS5: an identical correction leaves no revision', async () => {
    const { id } = await recordPodium.execute(wrestling);
    vi.setSystemTime(new Date('2026-11-05T19:00:00.000Z'));

    const result = await correctPodium.execute({ id, gold: 'SEN', silver: 'JPN', bronze: 'FRA' });

    expect(result.correctedAt).toBeNull();
    expect(await listRevisions.execute(id)).toEqual([]);
  });
});
