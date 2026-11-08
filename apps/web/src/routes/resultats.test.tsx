import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '@/mocks/control';
import { fixture } from '@/mocks/fixture';
import { axeFindings, runAxe } from '@/test/axe';
import { seedPodium, setOnline } from '@/test/seed';
import { renderRoute } from '@/test/utils';

afterEach(() => {
  setOnline(true);
  window.localStorage.clear();
});

const open = (query = '?day=2026-11-05') => renderRoute({ initialEntries: [`/resultats${query}`] });
const titles = (section: HTMLElement) =>
  within(section)
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent);

describe('day results screen', () => {
  it('005-AS1: shows the podiums of the chosen day, grouped by discipline', async () => {
    seedPodium({ eventName: 'Lutte filles 52 kg', discipline: 'Lutte' });
    seedPodium({ eventName: '100 m nage libre filles', discipline: 'Natation' });
    seedPodium({ eventName: 'Lutte garçons 65 kg', discipline: 'Lutte' });
    seedPodium({ eventName: 'Hors jour', discipline: 'Tir', day: '2026-11-06' });
    await open();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Jeudi 5 novembre' }),
    ).toBeVisible();
    expect(titles(await screen.findByRole('region', { name: 'Lutte' }))).toEqual([
      'Lutte garçons 65 kg',
      'Lutte filles 52 kg',
    ]);
    expect(titles(screen.getByRole('region', { name: 'Natation' }))).toEqual([
      '100 m nage libre filles',
    ]);
    expect(screen.queryByText('Hors jour')).toBeNull();
    expect(screen.getByText('3 épreuves · 2 disciplines')).toBeVisible();
  });

  it('005-AS3: lists the most recent podium first inside a discipline', async () => {
    seedPodium({ eventName: 'Premier' });
    seedPodium({ eventName: 'Second' });
    await open();
    expect(titles(await screen.findByRole('region', { name: 'Lutte' }))).toEqual([
      'Second',
      'Premier',
    ]);
  });

  it('005-AS4: shows an empty day, without error, and a way to another day', async () => {
    seedPodium({ day: '2026-11-06', eventName: 'Un autre jour' });
    await open();
    expect(
      await screen.findByRole('heading', { name: 'Aucun podium enregistré ce jour' }),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(await screen.findByRole('link', { name: 'Aller au 6 novembre' })).toBeVisible();
  });

  it('007-AS8: shows both bronzes of a combat event on the podium card', async () => {
    seedPodium({
      eventName: 'Judo – Men -66 kg',
      discipline: 'Judo',
      gold: 'UKR',
      silver: 'CAN',
      bronze: 'ARG',
      secondBronze: 'SEN',
    });
    await open();

    const card = (await screen.findByRole('heading', { name: 'Judo – Men -66 kg' })).closest(
      'article',
    );

    expect(card).not.toBeNull();
    const lines = within(card as HTMLElement).getAllByRole('listitem');
    expect(lines.map((line) => line.textContent)).toEqual([
      expect.stringContaining('UKR'),
      expect.stringContaining('CAN'),
      expect.stringContaining('ARG'),
      expect.stringContaining('SEN'),
    ]);
    expect(within(lines[2] as HTMLElement).getByText('Bronze')).toBeVisible();
    expect(within(lines[3] as HTMLElement).getByText('Bronze')).toBeVisible();
  });

  it('005-AS2: filters by discipline and tells an empty filter from an empty day', async () => {
    seedPodium({ eventName: 'Lutte filles 52 kg', discipline: 'Lutte' });
    seedPodium({ eventName: '100 m nage libre filles', discipline: 'Natation' });
    const { router } = await open();
    await screen.findByRole('region', { name: 'Lutte' });
    await userEvent.click(screen.getByRole('link', { name: 'Natation · 1' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Lutte' })).toBeNull());
    expect(screen.getByRole('region', { name: 'Natation' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Natation · 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await router.navigate({ to: '/resultats', search: { day: '2026-11-05', discipline: 'Tir' } });
    expect(
      await screen.findByRole('heading', { name: 'Aucun podium en Tir ce jour' }),
    ).toBeVisible();
  });

  it('marks the days that have a podium on the day strip', async () => {
    seedPodium({ day: '2026-11-06' });
    await open();
    const strip = await screen.findByRole('navigation', { name: 'Choisir un jour' });
    expect(within(strip).getAllByRole('link')).toHaveLength(14);
    expect(
      await within(strip).findByRole('link', { name: 'jeudi 5 novembre, aucun podium' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(strip).getByRole('link', { name: 'vendredi 6 novembre' })).toBeVisible();
  });

  it('shows a loading state, then the results', async () => {
    seedPodium();
    mockControl.setLatency(200);
    await open();
    expect(await screen.findByRole('status', { name: 'Chargement des résultats' })).toBeVisible();
    expect(await screen.findByRole('region', { name: 'Lutte' })).toBeVisible();
  });

  it('shows a readable error with a retry', async () => {
    seedPodium();
    mockControl.failNext('GET /api/podiums');
    await open();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Les résultats n’ont pas pu être chargés.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('region', { name: 'Lutte' })).toBeVisible();
  });

  it('keeps the results on screen when the network drops', async () => {
    seedPodium();
    await open();
    await screen.findByRole('region', { name: 'Lutte' });
    setOnline(false);
    expect(await screen.findByText(/Hors ligne/)).toBeVisible();
    expect(screen.getByRole('region', { name: 'Lutte' })).toBeVisible();
  });

  it('shows Mon pays with its rank and totals', async () => {
    seedPodium({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    await open();
    expect(
      await screen.findByRole('link', {
        name: 'Mon pays : Sénégal, 1er au tableau des médailles, 1 or, 0 argent, 0 bronze',
      }),
    ).toBeVisible();
  });

  it('006-AS4: opens the history of a corrected podium, with focus handled, and closes on Escape', async () => {
    const podium = seedPodium({
      eventName: 'Lutte filles 52 kg',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: '2026-11-05T19:00:00.000Z',
    });
    fixture.revisions.set(podium.id, [
      { gold: 'SEN', silver: 'FRA', bronze: 'JPN', correctedAt: '2026-11-05T19:00:00.000Z' },
    ]);
    await open();
    const stamp = await screen.findByRole('button', { name: /Corrigé le 5 novembre 2026/ });
    expect(stamp).toHaveTextContent('Corrigé 5 nov.');
    await userEvent.click(stamp);
    const dialog = await screen.findByRole('dialog', { name: 'Lutte filles 52 kg' });
    expect(
      await within(dialog).findByText('Version actuelle · corrigée le 5 novembre 2026'),
    ).toBeVisible();
    expect(within(dialog).getByText('Version remplacée le 5 novembre 2026')).toBeVisible();
    expect(within(dialog).getByText('Historique du podium · 2 versions')).toBeVisible();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(axeFindings(await runAxe())).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(stamp).toHaveFocus();
  });

  it('has no accessibility violation with results', async () => {
    seedPodium();
    await open();
    await screen.findByRole('region', { name: 'Lutte' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('has no accessibility violation on an empty day', async () => {
    await open();
    await screen.findByRole('heading', { name: 'Aucun podium enregistré ce jour' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});
