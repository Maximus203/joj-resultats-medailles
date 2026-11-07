import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultDay } from '@/lib/dates';
import { mockControl } from '@/mocks/control';
import { axeFindings, runAxe } from '@/test/axe';
import { seedPodium, setOnline } from '@/test/seed';
import { renderRoute } from '@/test/utils';

afterEach(() => setOnline(true));

const home = () => renderRoute({ initialEntries: ['/'] });

describe('home screen', () => {
  it('shows the last podium, the disciplines of the day, the day results and the top medals', async () => {
    const day = defaultDay();
    seedPodium({ eventName: 'Lutte filles 52 kg', discipline: 'Lutte', day });
    seedPodium({ eventName: '100 m nage libre filles', discipline: 'Natation', day });
    await home();
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Qui a gagné aujourd’hui ?',
    );
    expect(await screen.findByText('100 m nage libre filles', { selector: 'b' })).toBeVisible();
    const tiles = await screen.findByRole('link', { name: /Lutte/ });
    expect(tiles).toHaveTextContent('1 épreuve aujourd’hui');
    expect(await screen.findByRole('table')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Ayo, mascotte des JOJ Dakar 2026' })).toBeVisible();
    expect(screen.getByRole('img', { name: 'Sénégal AI Scaling Hub' })).toBeVisible();
  });

  it('shows empty states, without error, before the first podium', async () => {
    await home();
    expect(await screen.findByRole('heading', { name: 'Pas encore de podium' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Aucune médaille pour l’instant' })).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows loading states, then content', async () => {
    seedPodium({ day: defaultDay() });
    mockControl.setLatency(200);
    await home();
    expect(
      await screen.findByRole('status', { name: 'Chargement du dernier podium' }),
    ).toBeVisible();
    expect(await screen.findByRole('table')).toBeVisible();
  });

  it('shows readable errors with a retry', async () => {
    seedPodium({ day: defaultDay() });
    mockControl.failNext('GET /api/medals');
    await home();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le tableau n’a pas pu être chargé.');
    await userEvent.click(within(alert).getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });

  it('shows the offline bar', async () => {
    await home();
    await screen.findByRole('heading', { name: 'Pas encore de podium' });
    setOnline(false);
    expect(await screen.findByText(/Hors ligne/)).toBeVisible();
  });

  it('has no accessibility violation, with data and with empty states', async () => {
    seedPodium({ day: defaultDay() });
    await home();
    await screen.findByRole('table');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('has no accessibility violation on empty states', async () => {
    await home();
    await screen.findByRole('heading', { name: 'Pas encore de podium' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});

describe('unknown page', () => {
  it('draws a 404 page with a way back, without breaking', async () => {
    await renderRoute({ initialEntries: ['/nimporte-quoi'] });
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('keeps the skip link from changing the address', async () => {
    const { router } = await home();
    await screen.findByRole('heading', { name: 'Pas encore de podium' });
    await userEvent.click(screen.getByRole('link', { name: 'Aller au contenu' }));
    expect(router.state.location.hash).toBe('');
    expect(document.getElementById('contenu')).toHaveFocus();
  });
});
