import { describe, expect, it } from 'vitest';
import { durationMsOf } from './scrape-run';

describe('durationMsOf', () => {
  it('008-AS6: gives the duration of a run in milliseconds, from its start to its end', () => {
    const run = {
      startedAt: new Date('2026-11-03T08:00:00.000Z'),
      finishedAt: new Date('2026-11-03T08:00:01.500Z'),
    };

    expect(durationMsOf(run)).toBe(1500);
    expect(durationMsOf({ startedAt: run.startedAt, finishedAt: run.startedAt })).toBe(0);
  });
});
