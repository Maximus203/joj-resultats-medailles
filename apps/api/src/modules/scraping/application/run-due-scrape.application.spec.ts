import { Logger } from '@nestjs/common';
import { beforeAll, describe, expect, it } from 'vitest';
import { RunDueScrape } from './use-cases/run-due-scrape';
import { RunScrape } from './use-cases/run-scrape';
import { FakeResultsSource } from './testing/fake-results-source';
import { FixedClock } from './testing/fixed-clock';
import { InMemoryImportedPodiumRepository } from './testing/in-memory-imported-podium.repository';
import { InMemoryScrapeRunRepository } from './testing/in-memory-scrape-run.repository';
import { quietDay } from './testing/official-pages';
import { testSettings } from './testing/settings';
import type { ScrapingSettings } from './scraping-settings';

// Les journaux de l'import sont vérifiés en e2e et au playbook : ici, silence.
beforeAll(() => Logger.overrideLogger(false));

function setup(settings: ScrapingSettings = testSettings(), now = '2026-11-03T10:00:00Z') {
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
  return {
    source,
    runs,
    clock,
    runScrape,
    due: new RunDueScrape(runScrape, runs, clock, settings),
  };
}

const beat = { startup: false };

describe('RunDueScrape', () => {
  it('008-AS1: runs a light import at 08:00 then every 15 minutes, never at 07:59 or 23:01', async () => {
    const { due, clock, runs } = setup();
    clock.set('2026-11-03T07:59:00Z');
    await due.execute({ startup: false });
    runs.runs.length = 0;

    clock.set('2026-11-03T08:00:00Z');
    const first = await due.execute(beat);
    clock.set('2026-11-03T08:14:00Z');
    const early = await due.execute(beat);
    clock.set('2026-11-03T08:15:00Z');
    const second = await due.execute(beat);
    clock.set('2026-11-03T23:30:00Z');
    const late = await due.execute(beat);

    expect(first).toMatchObject({ kind: 'incremental', trigger: 'scheduled', status: 'success' });
    expect(early).toBeNull();
    expect(second).toMatchObject({ kind: 'incremental' });
    expect(late).toBeNull();
    expect(runs.runs.map((run) => run.kind)).toEqual(['incremental', 'incremental']);
  });

  it('008-AS3: runs a full import at 07:00 and at 23:00, once each, reading every day so far', async () => {
    const { due, clock, runs, source } = setup();
    clock.set('2026-11-02T23:00:05Z');
    await due.execute(beat);
    source.requests.length = 0;

    clock.set('2026-11-03T07:00:00Z');
    const morning = await due.execute(beat);
    clock.set('2026-11-03T07:01:00Z');
    const again = await due.execute(beat);
    clock.set('2026-11-03T23:00:00Z');
    const night = await due.execute(beat);

    expect(morning).toMatchObject({ kind: 'full', trigger: 'scheduled' });
    expect(again).toBeNull();
    expect(night).toMatchObject({ kind: 'full' });
    expect(source.requests.slice(0, 3)).toEqual([
      'schedule:2026-11-01',
      'schedule:2026-11-02',
      'schedule:2026-11-03',
    ]);
    expect(runs.runs.filter((run) => run.kind === 'full')).toHaveLength(3);
  });

  it('008-AS4: catches up with a full import at startup after more than a day without success', async () => {
    const { due, clock } = setup();
    clock.set('2026-11-02T23:00:10Z');
    await due.execute(beat);
    clock.set('2026-11-04T05:00:00Z');

    expect(await due.execute(beat)).toBeNull();
    const run = await due.execute({ startup: true });

    expect(run).toMatchObject({ kind: 'full', trigger: 'startup' });
  });

  it('008-AS5: skips a light import that falls during a full one, and traces it as skipped', async () => {
    const { due, runScrape, source, runs, clock } = setup(testSettings(), '2026-11-03T07:00:00Z');
    let release: () => void = () => undefined;
    source.gate = new Promise<void>((resolve) => (release = resolve));
    const full = runScrape.execute('scheduled', 'full');
    await new Promise((resolve) => setTimeout(resolve, 0));
    clock.set('2026-11-03T08:00:00Z');

    const skipped = await due.execute(beat);
    const requestsWhileFull = [...source.requests];
    release();
    await full;

    expect(skipped).toMatchObject({ kind: 'incremental', status: 'skipped' });
    expect(skipped?.report.skippedReason).toMatch(/en cours/);
    expect(skipped?.report.errors).toEqual([]);
    expect(requestsWhileFull).toEqual(['schedule:2026-11-01']);
    expect(runs.runs.filter((run) => run.status === 'skipped')).toHaveLength(1);
  });

  it('007-AS6: never runs when the import is disabled, which is the default', async () => {
    const { due, source } = setup(testSettings({ enabled: false }), '2026-11-03T23:00:00Z');

    expect(await due.execute({ startup: true })).toBeNull();
    expect(source.requests).toEqual([]);
  });

  it('007-AS6: does not run outside the Games', async () => {
    const { due, source } = setup(testSettings(), '2026-11-16T23:00:00Z');

    expect(await due.execute({ startup: true })).toBeNull();
    expect(source.requests).toEqual([]);
  });
});
