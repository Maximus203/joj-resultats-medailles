// Prouve le bandeau de fraîcheur : « Données à jour à HH:MM » (heure du fuseau de l'import), puis un
// avertissement lisible quand l'API dit que les données sont périmées, et rien quand l'import est éteint.
import type { ScrapeStatus } from '@joj/shared';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockControl } from '@/mocks/control';
import { fixture } from '@/mocks/fixture';
import { scrapingKeys } from '@/lib/query-keys';
import { axeFindings, runAxe } from '@/test/axe';
import { renderRoute } from '@/test/utils';

const status = (patch: Partial<ScrapeStatus>): ScrapeStatus => ({
  ...fixture.scraping,
  enabled: true,
  lastSuccessAt: '2026-11-03T14:07:00.000Z',
  ...patch,
});

describe('freshness banner', () => {
  // Seule la date est simulée : « 14:07 » doit rester récent, et le test ne dépend pas du jour où il tourne.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-03T14:30:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('008-AS8: says when the data was last updated, in the time zone of the import', async () => {
    fixture.scraping = status({});
    await renderRoute({ initialEntries: ['/medailles'] });

    expect(await screen.findByText('Données à jour à 14:07')).toBeVisible();
    expect(screen.queryByText(/n’ont pas été mis à jour/)).toBeNull();
  });

  it('008-AS8: reads the hour in Dakar time, not in the browser time', async () => {
    fixture.scraping = status({
      schedule: { ...fixture.scraping.schedule, timeZone: 'Asia/Kolkata' },
    });
    await renderRoute({ initialEntries: ['/resultats?day=2026-11-03'] });

    expect(await screen.findByText('Données à jour à 19:37')).toBeVisible();
  });

  it('008-AS8: turns into a readable warning when the data is stale', async () => {
    fixture.scraping = status({ stale: true });
    await renderRoute({ initialEntries: ['/medailles'] });

    const alert = await screen.findByText('Les résultats sont peut-être en retard');
    expect(alert).toBeVisible();
    expect(
      screen.getByText('Ils n’ont pas été mis à jour depuis 14:07. Revenez dans quelques minutes.'),
    ).toBeVisible();
    expect(screen.queryByText(/Données à jour à/)).toBeNull();
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('008-AS8: warns plainly when the data is stale and no import ever succeeded', async () => {
    fixture.scraping = status({ stale: true, lastSuccessAt: null });
    await renderRoute({ initialEntries: ['/medailles'] });

    expect(await screen.findByText('Aucune mise à jour réussie pour l’instant')).toBeVisible();
    expect(
      screen.getByText('Les résultats peuvent être incomplets. Revenez dans quelques minutes.'),
    ).toBeVisible();
    expect(screen.queryByText(/Données à jour à/)).toBeNull();
  });

  it('008-AS8: never claims a freshness it cannot check: the state request fails after a fresh banner', async () => {
    fixture.scraping = status({});
    const { queryClient } = await renderRoute({ initialEntries: ['/medailles'] });
    expect(await screen.findByText('Données à jour à 14:07')).toBeVisible();

    mockControl.failPersistently('GET /api/scraping');
    await queryClient.invalidateQueries({ queryKey: scrapingKeys.status });

    expect(
      await screen.findByText('Impossible de vérifier la fraîcheur des données'),
    ).toBeVisible();
    expect(screen.queryByText(/Données à jour à/)).toBeNull();
  });

  it('008-AS8: warns that it cannot check the freshness when the state is unreachable from the start', async () => {
    mockControl.failPersistently('GET /api/scraping');
    await renderRoute({ initialEntries: ['/resultats?day=2026-11-03'] });

    expect(
      await screen.findByText('Impossible de vérifier la fraîcheur des données'),
    ).toBeVisible();
  });

  it('008-AS8: stays silent on an API that does not know the state route at all (404)', async () => {
    mockControl.failPersistently('GET /api/scraping', 404);
    await renderRoute({ initialEntries: ['/medailles'] });
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText(/fraîcheur/)).toBeNull();
    expect(screen.queryByText(/Données à jour à/)).toBeNull();
  });

  it('008-AS8: turns into a warning by itself when the last success is older than the threshold, even if the server said fresh', async () => {
    const threeHoursAgo = '2026-11-03T11:30:00.000Z';
    fixture.scraping = status({
      stale: false,
      lastSuccessAt: threeHoursAgo,
      schedule: { ...fixture.scraping.schedule, windowStart: '00:00', windowEnd: '23:59' },
    });
    await renderRoute({ initialEntries: ['/medailles'] });

    expect(await screen.findByText('Les résultats sont peut-être en retard')).toBeVisible();
    expect(screen.queryByText(/Données à jour à/)).toBeNull();
  });

  it('008-AS8: says nothing when the import is off or has not run yet', async () => {
    fixture.scraping = status({ enabled: false });
    await renderRoute({ initialEntries: ['/medailles'] });
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText(/Données à jour à/)).toBeNull();
    expect(screen.queryByText(/en retard/)).toBeNull();
  });
});
