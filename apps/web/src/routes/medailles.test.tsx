import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '@/mocks/control';
import { axeFindings, runAxe } from '@/test/axe';
import { seedPodium, setOnline } from '@/test/seed';
import { renderRoute } from '@/test/utils';

afterEach(() => {
  setOnline(true);
  window.localStorage.clear();
});

const open = () => renderRoute({ initialEntries: ['/medailles'] });

describe('medal table screen', () => {
  it('004-AS1: shows one row per country, sorted by gold, silver, then bronze', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    seedPodium({ gold: 'JPN', silver: 'SEN', bronze: 'USA' });
    seedPodium({ gold: 'SEN', silver: 'FRA', bronze: 'JPN' });
    await open();
    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    const codes = rows.map((row) => row.querySelector('.plaque')?.textContent);
    expect(codes).toEqual(['SEN', 'JPN', 'FRA', 'USA']);
  });

  it('004-AS2: announces a shared rank as ex æquo and skips the next one', async () => {
    seedPodium({ gold: 'SEN', silver: 'FRA', bronze: 'USA' });
    seedPodium({ gold: 'JPN', silver: 'GER', bronze: 'ITA' });
    await open();
    const table = await screen.findByRole('table');
    expect(within(table).getAllByText('ex æquo')).toHaveLength(6);
    const ranks = within(table)
      .getAllByRole('rowheader')
      .map((header) => header.textContent);
    expect(ranks[0]).toBe('Rang 1ex æquo');
    expect(ranks[2]).toBe('Rang 3ex æquo');
  });

  it('004-AS3: shows an empty state, not an error, when no podium exists', async () => {
    await open();
    expect(
      await screen.findByRole('heading', { name: 'Aucune médaille pour l’instant' }),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows a loading state while the table loads', async () => {
    mockControl.setLatency(200);
    await open();
    expect(await screen.findByRole('status', { name: 'Chargement du tableau' })).toBeVisible();
    expect(
      await screen.findByRole('heading', { name: 'Aucune médaille pour l’instant' }),
    ).toBeVisible();
  });

  it('shows a readable error with a retry that reloads the table', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    mockControl.failNext('GET /api/medals');
    await open();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le tableau n’a pas pu être chargé.');
    expect(alert).not.toHaveTextContent(/INTERNAL|500|HTTP/);
    await userEvent.click(within(alert).getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });

  it('highlights Mon pays and keeps the choice on the device', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    await open();
    await screen.findByRole('table');
    const select = screen.getByRole('combobox', { name: 'Mon pays' });
    expect(select).toHaveValue('SEN');
    await userEvent.selectOptions(select, 'FRA');
    expect(window.localStorage.getItem('joj.mon-pays')).toBe('FRA');
    expect(screen.getByRole('cell', { name: /FRA.*\(mon pays\)/ })).toBeVisible();
  });

  it('shows the offline bar and keeps the last table on screen', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    await open();
    await screen.findByRole('table');
    setOnline(false);
    expect(await screen.findByText(/Hors ligne/)).toBeVisible();
    expect(screen.getByRole('table')).toBeVisible();
  });

  it('has no accessibility violation, with a table and with an empty state', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    await open();
    await screen.findByRole('table');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('has no accessibility violation on the empty state', async () => {
    await open();
    await screen.findByRole('heading', { name: 'Aucune médaille pour l’instant' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});
