import { Logger } from '@nestjs/common';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScrapingSettings } from '../application/scraping-settings';
import { ScrapeScheduler } from './scrape-scheduler';

const SETTINGS: ScrapingSettings = {
  enabled: true,
  firstDay: '2026-11-01',
  lastDay: '2026-11-13',
  dailyTime: '23:00',
  timeZone: 'Africa/Dakar',
  intervalMinutes: null,
  tickSeconds: 60,
};
const BEAT = SETTINGS.tickSeconds * 1000;

function setup(settings: ScrapingSettings = SETTINGS) {
  const execute = vi.fn<(input: { startup: boolean }) => Promise<null>>(async () => null);
  const scheduler = new ScrapeScheduler({ execute }, settings);
  return { execute, scheduler };
}

describe('ScrapeScheduler', () => {
  beforeAll(() => Logger.overrideLogger(false));
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('007-AS6: asks for a catch-up at startup, then asks on every beat', async () => {
    const { execute, scheduler } = setup();

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(0);
    expect(execute.mock.calls).toEqual([[{ startup: true }]]);
    await vi.advanceTimersByTimeAsync(BEAT);
    await vi.advanceTimersByTimeAsync(BEAT);

    expect(execute.mock.calls).toEqual([
      [{ startup: true }],
      [{ startup: false }],
      [{ startup: false }],
    ]);
    scheduler.onApplicationShutdown();
  });

  it('007-AS6: does not overlap: a beat during a tick still in progress asks for nothing', async () => {
    const { execute, scheduler } = setup();
    let finish: () => void = () => undefined;
    execute.mockImplementationOnce(
      () => new Promise<null>((resolve) => (finish = () => resolve(null))),
    );

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(BEAT * 3);
    expect(execute).toHaveBeenCalledTimes(1);
    finish();
    await vi.advanceTimersByTimeAsync(BEAT);

    expect(execute).toHaveBeenCalledTimes(2);
    scheduler.onApplicationShutdown();
  });

  it('007-AS6: keeps beating after a failed tick', async () => {
    const { execute, scheduler } = setup();
    execute.mockRejectedValueOnce(new Error('base injoignable'));

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(BEAT);

    expect(execute).toHaveBeenCalledTimes(2);
    scheduler.onApplicationShutdown();
  });

  it('007-AS6: starts nothing when the import is disabled, and stops beating at shutdown', async () => {
    const off = setup({ ...SETTINGS, enabled: false });
    off.scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(BEAT * 5);
    expect(off.execute).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    const on = setup();
    on.scheduler.onApplicationBootstrap();
    on.scheduler.onApplicationShutdown();
    await vi.advanceTimersByTimeAsync(BEAT * 5);
    expect(on.execute).toHaveBeenCalledTimes(1);
  });
});
