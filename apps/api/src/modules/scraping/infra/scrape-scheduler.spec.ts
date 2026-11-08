import { Logger } from '@nestjs/common';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScrapingSettings } from '../application/scraping-settings';
import { CheckStaleness } from '../application/use-cases/check-staleness';
import { RunDueScrape } from '../application/use-cases/run-due-scrape';
import { RunScrape } from '../application/use-cases/run-scrape';
import { FakeResultsSource } from '../application/testing/fake-results-source';
import { FixedClock } from '../application/testing/fixed-clock';
import { InMemoryImportedPodiumRepository } from '../application/testing/in-memory-imported-podium.repository';
import { InMemoryScrapeRunRepository } from '../application/testing/in-memory-scrape-run.repository';
import { quietDay } from '../application/testing/official-pages';
import { testSettings } from '../application/testing/settings';
import { ScrapeScheduler } from './scrape-scheduler';

const SETTINGS: ScrapingSettings = testSettings();
const BEAT = SETTINGS.tickSeconds * 1000;

function setup(settings: ScrapingSettings = SETTINGS) {
  const execute = vi.fn<(input: { startup: boolean }) => Promise<null>>(async () => null);
  const staleness = vi.fn<() => Promise<boolean>>(async () => false);
  const scheduler = new ScrapeScheduler({ execute }, { execute: staleness }, settings);
  return { execute, staleness, scheduler };
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

  it('008-AS7: asks and checks staleness on every beat, even while an import is still running', async () => {
    const { execute, staleness, scheduler } = setup();
    execute.mockImplementationOnce(() => new Promise<null>(() => undefined));

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(BEAT * 3);

    // Le chevauchement est l'affaire de RunScrape : chaque battement demande, la décision se trace.
    expect(execute).toHaveBeenCalledTimes(4);
    expect(staleness).toHaveBeenCalledTimes(4);
    scheduler.onApplicationShutdown();
  });
});

/** Le vrai planificateur sur le vrai RunDueScrape et le vrai RunScrape : horloge et battements simulés. */
describe('ScrapeScheduler with the real use cases', () => {
  beforeAll(() => Logger.overrideLogger(false));
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function wire(now: string) {
    const settings = testSettings();
    const source = new FakeResultsSource();
    for (const day of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']) {
      source.schedules.set(day, quietDay);
    }
    const runs = new InMemoryScrapeRunRepository();
    const clock = new FixedClock(new Date(now));
    const runScrape = new RunScrape(
      source,
      new InMemoryImportedPodiumRepository(),
      runs,
      clock,
      settings,
    );
    const runDue = new RunDueScrape(runScrape, runs, clock, settings);
    const scheduler = new ScrapeScheduler(
      runDue,
      new CheckStaleness(runs, clock, settings),
      settings,
    );
    let release: () => void = () => undefined;
    const hold = () => {
      source.gate = new Promise<void>((resolve) => (release = resolve));
    };
    return { source, runs, clock, runScrape, scheduler, hold, release: () => release() };
  }
  const beat = async (clock: FixedClock, at: string) => {
    clock.set(at);
    await vi.advanceTimersByTimeAsync(BEAT);
  };
  const lastSuccess = (
    runs: InMemoryScrapeRunRepository,
    startedAt: string,
    kind: 'full' | 'incremental' = 'incremental',
  ) =>
    runs.add({
      id: crypto.randomUUID(),
      trigger: 'scheduled',
      kind,
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

  it('008-AS5: traces as skipped a light import that falls during a scheduled full import', async () => {
    const { runs, clock, runScrape, scheduler, hold, release } = wire('2026-11-03T07:00:00Z');
    hold();

    scheduler.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(0);
    expect(runScrape.running).toBe(true);
    await beat(clock, '2026-11-03T08:00:30Z');
    release();
    await runScrape.whenIdle();
    scheduler.onApplicationShutdown();

    expect(runs.runs.map((run) => [run.kind, run.status])).toEqual([
      ['full', 'success'],
      ['incremental', 'skipped'],
    ]);
    expect(runs.runs[1]?.report.skippedReason).toMatch(/en cours/);
  });

  it('008-AS5: traces as skipped a light import that falls during a manual import', async () => {
    const { runs, clock, runScrape, scheduler, hold, release } = wire('2026-11-03T09:00:00Z');
    await lastSuccess(runs, '2026-11-03T07:00:05Z', 'full');
    await lastSuccess(runs, '2026-11-03T08:50:00Z');
    scheduler.onApplicationBootstrap();
    // Le battement de démarrage est évalué à l'heure de départ, avant que le test ne déplace l'horloge.
    await vi.advanceTimersByTimeAsync(0);
    hold();
    const manual = runScrape.execute('manual', 'full');

    await beat(clock, '2026-11-03T09:06:00Z');
    release();
    await manual;
    scheduler.onApplicationShutdown();

    expect(runs.runs.filter((run) => run.status === 'skipped')).toMatchObject([
      { kind: 'incremental' },
    ]);
  });

  it('008-AS5: does not lose a full slot that falls during an import: it runs on a later beat', async () => {
    const { runs, clock, runScrape, scheduler, hold, release } = wire('2026-11-03T22:59:00Z');
    await lastSuccess(runs, '2026-11-03T07:00:05Z', 'full');
    await lastSuccess(runs, '2026-11-03T22:50:00Z');
    scheduler.onApplicationBootstrap();
    // Le battement de démarrage est évalué à l'heure de départ, avant que le test ne déplace l'horloge.
    await vi.advanceTimersByTimeAsync(0);
    hold();
    const manual = runScrape.execute('manual', 'full');

    await beat(clock, '2026-11-03T23:00:10Z');
    await beat(clock, '2026-11-03T23:01:10Z');
    release();
    await manual;
    await beat(clock, '2026-11-03T23:01:40Z');
    await runScrape.whenIdle();
    scheduler.onApplicationShutdown();

    expect(runs.runs.filter((run) => run.status === 'skipped')).toEqual([]);
    expect(runs.runs[0]).toMatchObject({ kind: 'full', trigger: 'scheduled' });
    expect(runs.runs[0]?.startedAt).toEqual(new Date('2026-11-03T23:01:40Z'));
  });

  it('008-AS5: traces a full slot as skipped only when it expires without having run', async () => {
    const { runs, clock, runScrape, scheduler, hold, release } = wire('2026-11-03T22:59:00Z');
    await lastSuccess(runs, '2026-11-03T07:00:05Z', 'full');
    await lastSuccess(runs, '2026-11-03T22:50:00Z');
    scheduler.onApplicationBootstrap();
    // Le battement de démarrage est évalué à l'heure de départ, avant que le test ne déplace l'horloge.
    await vi.advanceTimersByTimeAsync(0);
    hold();
    const manual = runScrape.execute('manual', 'full');

    await beat(clock, '2026-11-03T23:00:10Z');
    expect(runs.runs.filter((run) => run.status === 'skipped')).toEqual([]);
    await beat(clock, '2026-11-03T23:03:10Z');
    release();
    await manual;
    scheduler.onApplicationShutdown();

    const skipped = runs.runs.filter((run) => run.status === 'skipped');
    expect(skipped).toMatchObject([{ kind: 'full' }]);
    expect(skipped[0]?.report.skippedReason).toMatch(/23:00.*perdu/);
  });

  it('008-AS7: logs the stale warning once for the whole episode, over many beats', async () => {
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const { clock, runScrape, scheduler, hold, release } = wire('2026-11-03T10:00:00Z');
    hold();

    scheduler.onApplicationBootstrap();
    for (const at of ['10:01', '10:02', '10:03', '10:04', '10:05']) {
      await beat(clock, `2026-11-03T${at}:00Z`);
    }
    release();
    await runScrape.whenIdle();
    scheduler.onApplicationShutdown();

    expect(
      warn.mock.calls.filter(([message]) => String(message).includes('périmées')),
    ).toHaveLength(1);
    warn.mockRestore();
  });
});
