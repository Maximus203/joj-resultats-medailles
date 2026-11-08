import { Logger } from '@nestjs/common';
import { beforeAll, describe, expect, it } from 'vitest';
import { RunDueScrape } from './use-cases/run-due-scrape';
import { RunScrape } from './use-cases/run-scrape';
import type { ScrapingSettings } from './scraping-settings';
import { quietDay } from './testing/official-pages';
import { FakeResultsSource } from './testing/fake-results-source';
import { FixedClock } from './testing/fixed-clock';
import { InMemoryImportedPodiumRepository } from './testing/in-memory-imported-podium.repository';
import { InMemoryScrapeRunRepository } from './testing/in-memory-scrape-run.repository';

const SETTINGS: ScrapingSettings = {
  enabled: true,
  firstDay: '2026-11-01',
  lastDay: '2026-11-13',
  dailyTime: '23:00',
  timeZone: 'Africa/Dakar',
  intervalMinutes: null,
  tickSeconds: 60,
};

function setup(settings: ScrapingSettings = SETTINGS, now = '2026-11-03T10:00:00Z') {
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

// Les journaux de l'import sont vérifiés en e2e et au playbook : ici, silence.
beforeAll(() => Logger.overrideLogger(false));

describe('RunDueScrape', () => {
  it('007-AS6: runs once at 23:00 Dakar time, not before, not twice in the same minute', async () => {
    const { due, clock, runs } = setup();
    clock.set('2026-11-02T23:00:05Z');
    await due.execute({ startup: false });

    clock.set('2026-11-03T22:59:00Z');
    expect(await due.execute({ startup: false })).toBeNull();
    clock.set('2026-11-03T23:00:00Z');
    const run = await due.execute({ startup: false });
    clock.set('2026-11-03T23:01:00Z');
    expect(await due.execute({ startup: false })).toBeNull();

    expect(run).toMatchObject({ trigger: 'scheduled', status: 'success' });
    expect(runs.runs).toHaveLength(2);
  });

  it('007-AS6: catches up at startup after more than a day without a successful import', async () => {
    const { due, clock } = setup();
    clock.set('2026-11-02T23:00:10Z');
    await due.execute({ startup: false });
    clock.set('2026-11-04T07:00:00Z');

    const run = await due.execute({ startup: true });

    expect(run).toMatchObject({ trigger: 'startup' });
  });

  it('007-AS6: never runs when the import is disabled, which is the default', async () => {
    const { due, source } = setup({ ...SETTINGS, enabled: false }, '2026-11-03T23:00:00Z');

    expect(await due.execute({ startup: true })).toBeNull();
    expect(source.requests).toEqual([]);
  });

  it('007-AS6: does not run outside the Games', async () => {
    const { due, source } = setup(SETTINGS, '2026-11-16T23:00:00Z');

    expect(await due.execute({ startup: true })).toBeNull();
    expect(source.requests).toEqual([]);
  });

  it('007-AS6: leaves a run in progress alone instead of starting a second one', async () => {
    const { due, runScrape, source } = setup(SETTINGS, '2026-11-03T23:00:00Z');
    let release: () => void = () => undefined;
    source.gate = new Promise<void>((resolve) => (release = resolve));
    const running = runScrape.execute('manual');

    expect(await due.execute({ startup: false })).toBeNull();
    release();
    await running;
  });
});
