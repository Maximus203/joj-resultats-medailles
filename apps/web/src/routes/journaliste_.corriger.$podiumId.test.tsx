import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { mockControl } from '@/mocks/control';
import { axeFindings, runAxe } from '@/test/axe';
import { seedPodium, setOnline } from '@/test/seed';
import { renderRoute, trackRequests, writes } from '@/test/utils';

afterEach(() => setOnline(true));

const open = (id: string) => renderRoute({ initialEntries: [`/journaliste/corriger/${id}`] });
const seedWrestling = () =>
  seedPodium({ eventName: 'Lutte filles 52 kg', gold: 'SEN', silver: 'FRA', bronze: 'JPN' });

async function retype(user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Le premier test du fichier paie le premier rendu de toute l'application : 2,9 s seul, plus de
 * 5 s quand `pnpm check` lance l'API, le web et les outils en parallèle. Délai explicite pour lui
 * seul, comme pour 001-AS1 dans `journaliste.test.tsx` ; pas de relèvement global.
 */
const SLOW_FIRST_RENDER_MS = 20_000;

describe('correct a podium screen', () => {
  it(
    '006-AS1: corrects the silver and bronze, then offers the history behind the dated stamp',
    async () => {
      const user = userEvent.setup();
      const podium = seedWrestling();
      const seen = trackRequests();
      await open(podium.id);
      const submit = await screen.findByRole('button', { name: 'Aucun changement à publier' });
      expect(submit).toBeDisabled();
      await retype(user, /Pays de l’argent/, 'JPN');
      await retype(user, /Pays du bronze/, 'FRA');
      expect(screen.getByText('Était : FRA')).toBeVisible();
      expect(screen.getByText('Était : JPN')).toBeVisible();
      await user.click(screen.getByRole('button', { name: 'Publier la correction' }));
      expect(await screen.findByText('Correction publiée.')).toBeVisible();
      expect(writes(seen)[0]).toMatchObject({
        method: 'PUT',
        path: `/api/podiums/${podium.id}`,
        body: { gold: 'SEN', silver: 'JPN', bronze: 'FRA' },
      });
      const stamp = await screen.findByRole('button', { name: /Corrigé le/ });
      await user.click(stamp);
      const dialog = await screen.findByRole('dialog', { name: 'Lutte filles 52 kg' });
      expect(await within(dialog).findByText(/Version remplacée le/)).toBeVisible();
    },
    SLOW_FIRST_RENDER_MS,
  );

  it('006-AS2: refuses a repeated country and names it', async () => {
    const user = userEvent.setup();
    const podium = seedWrestling();
    await open(podium.id);
    await screen.findByLabelText(/Pays de l’or/);
    await retype(user, /Pays de l’argent/, 'JPN');
    await retype(user, /Pays du bronze/, 'JPN');
    await user.click(screen.getByRole('button', { name: 'Publier la correction' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Un pays ne peut pas figurer deux fois.');
    expect(alert).toHaveTextContent(
      'JPN apparaît en argent et en bronze. Le podium publié n’a pas changé.',
    );
    expect(screen.getByLabelText(/Pays de l’argent/)).toHaveAttribute('aria-invalid', 'true');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('006-AS3: says so when the podium does not exist', async () => {
    seedWrestling();
    await open(crypto.randomUUID());
    expect(await screen.findByRole('heading', { name: 'Ce podium n’existe pas' })).toBeVisible();
  });

  it('explains a failed publication in plain words', async () => {
    const user = userEvent.setup();
    const podium = seedWrestling();
    await open(podium.id);
    await screen.findByLabelText(/Pays de l’or/);
    await retype(user, /Pays de l’argent/, 'JPN');
    mockControl.failNext('PUT /api/podiums/:id', 500);
    await user.click(screen.getByRole('button', { name: 'Publier la correction' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La correction n’a pas été publiée.',
    );
  });

  it('shows a loading state, then the form', async () => {
    const podium = seedWrestling();
    mockControl.setLatency(200);
    await open(podium.id);
    expect(await screen.findByRole('status', { name: 'Chargement du podium' })).toBeVisible();
    expect(await screen.findByLabelText(/Pays de l’or/)).toBeVisible();
  });

  it('disables the publication and says why when the network is down', async () => {
    const user = userEvent.setup();
    const podium = seedWrestling();
    await open(podium.id);
    await screen.findByLabelText(/Pays de l’or/);
    await retype(user, /Pays de l’argent/, 'JPN');
    setOnline(false);
    expect(
      await screen.findByRole('button', { name: 'Publier (connexion requise)' }),
    ).toBeDisabled();
  });

  it('has no accessibility violation', async () => {
    const podium = seedWrestling();
    await open(podium.id);
    await screen.findByLabelText(/Pays de l’or/);
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});
