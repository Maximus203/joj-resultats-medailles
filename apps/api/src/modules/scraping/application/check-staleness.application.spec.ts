import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckStaleness } from './use-cases/check-staleness';
import { FixedClock } from './testing/fixed-clock';
import { InMemoryScrapeRunRepository } from './testing/in-memory-scrape-run.repository';
import { testSettings } from './testing/settings';
import type { ScrapeRun } from '../domain/scrape-run';

const success = (startedAt: string): ScrapeRun => ({
  id: crypto.randomUUID(),
  trigger: 'scheduled',
  kind: 'incremental',
  status: 'success',
  startedAt: new Date(startedAt),
  finishedAt: new Date(startedAt),
  report: {
    imported: [],
    updated: [],
    kept: [],
    identical: 0,
    absentFromSource: [],
    exhaustiveness: {
      daysRead: [],
      daysFailed: [],
      finalsSeen: 0,
      finalsWithPodium: 0,
      finalsKnown: 0,
      ignored: [],
    },
    errors: [],
  },
});

const idle = { running: false };

describe('CheckStaleness', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('008-AS7: logs one warning per stale episode, and a new one only after a return to fresh', async () => {
    const runs = new InMemoryScrapeRunRepository();
    const clock = new FixedClock(new Date('2026-11-03T09:00:00Z'));
    const check = new CheckStaleness(runs, clock, testSettings(), idle);
    await runs.add(success('2026-11-03T08:00:00Z'));

    expect(await check.execute()).toBe(false);
    clock.set('2026-11-03T10:01:00Z');
    expect(await check.execute()).toBe(true);
    clock.set('2026-11-03T10:02:00Z');
    expect(await check.execute()).toBe(true);
    clock.set('2026-11-03T10:03:00Z');
    await check.execute();
    expect(warn).toHaveBeenCalledTimes(1);

    await runs.add(success('2026-11-03T10:05:00Z'));
    clock.set('2026-11-03T10:06:00Z');
    expect(await check.execute()).toBe(false);
    clock.set('2026-11-03T12:06:01Z');
    expect(await check.execute()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('008-AS7: never warns outside the window or when the import is off', async () => {
    const runs = new InMemoryScrapeRunRepository();
    const clock = new FixedClock(new Date('2026-11-03T23:30:00Z'));

    expect(await new CheckStaleness(runs, clock, testSettings(), idle).execute()).toBe(false);
    clock.set('2026-11-03T12:00:00Z');
    expect(
      await new CheckStaleness(runs, clock, testSettings({ enabled: false }), idle).execute(),
    ).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });
});
