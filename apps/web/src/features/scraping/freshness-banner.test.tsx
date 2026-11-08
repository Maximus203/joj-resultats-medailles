// Prouve le bandeau de fraîcheur : « Données à jour à HH:MM » (heure du fuseau de l'import), puis un
// avertissement lisible quand l'API dit que les données sont périmées, et rien quand l'import est éteint.
import type { ScrapeStatus } from '@joj/shared';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fixture } from '@/mocks/fixture';
import { axeFindings, runAxe } from '@/test/axe';
import { renderRoute } from '@/test/utils';

const status = (patch: Partial<ScrapeStatus>): ScrapeStatus => ({
  ...fixture.scraping,
  enabled: true,
  lastSuccessAt: '2026-11-03T14:07:00.000Z',
  ...patch,
});

describe('freshness banner', () => {
  it('008-AS8: says when the data was last updated, in the time zone of the import', async () => {
    fixture.scraping = status({});
    await renderRoute({ initialEntries: ['/medailles'] });

    expect(await screen.findByText('Données à jour à 14:07')).toBeVisible();
    expect(screen.queryByText(/pas été mises à jour/)).toBeNull();
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

  it('008-AS8: says nothing when the import is off or has not run yet', async () => {
    fixture.scraping = status({ enabled: false });
    await renderRoute({ initialEntries: ['/medailles'] });
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByText(/Données à jour à/)).toBeNull();
    expect(screen.queryByText(/en retard/)).toBeNull();
  });
});
