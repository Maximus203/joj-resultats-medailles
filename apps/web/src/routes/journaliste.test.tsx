import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { fixture } from '@/mocks/fixture';
import { mockControl } from '@/mocks/control';
import { axeFindings, runAxe } from '@/test/axe';
import { seedPodium, setOnline } from '@/test/seed';
import { renderRoute, trackRequests, writes } from '@/test/utils';

afterEach(() => setOnline(true));

const open = () => renderRoute({ initialEntries: ['/journaliste'] });

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: { nom?: string; disc?: string; or?: string; ar?: string; br?: string },
) {
  if (values.nom !== undefined) await user.type(screen.getByLabelText('Épreuve'), values.nom);
  if (values.disc !== undefined) await user.type(screen.getByLabelText('Discipline'), values.disc);
  if (values.or !== undefined) await user.type(screen.getByLabelText(/Pays de l’or/), values.or);
  if (values.ar !== undefined)
    await user.type(screen.getByLabelText(/Pays de l’argent/), values.ar);
  if (values.br !== undefined) await user.type(screen.getByLabelText(/Pays du bronze/), values.br);
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Enregistrer le podium' }));

/** Chaque identifiant cité par aria-describedby doit exister dans la page. */
function describedByTargetsExist(): string[] {
  const missing: string[] = [];
  for (const element of document.querySelectorAll('[aria-describedby]')) {
    for (const id of (element.getAttribute('aria-describedby') ?? '').split(/\s+/)) {
      if (id && !document.getElementById(id)) missing.push(id);
    }
  }
  return missing;
}

/**
 * Les deux premiers tests du fichier paient le premier rendu de toute l'application (routes,
 * Radix, fausse API) : 1,8 s seul, 2,2 s dans le projet web, mais plus de 5 s quand `pnpm check`
 * lance l'API, le web et les outils en parallèle. Un délai explicite pour eux seuls, pas de
 * relèvement global.
 */
const SLOW_FIRST_RENDER_MS = 20_000;

const wrestling = { nom: 'Lutte filles 52 kg', disc: 'Lutte', or: 'SEN', ar: 'JPN', br: 'FRA' };

describe('record a podium screen', () => {
  it(
    '001-AS1: records the podium, then shows it back as the public will read it',
    async () => {
      const user = userEvent.setup();
      const seen = trackRequests();
      await open();
      await fill(user, wrestling);
      await submit(user);
      expect(await screen.findByText('Podium enregistré.')).toBeVisible();
      const card = screen.getByRole('article');
      expect(within(card).getByRole('heading', { name: 'Lutte filles 52 kg' })).toBeVisible();
      expect(within(card).getAllByText(/^(SEN|JPN|FRA)$/)).toHaveLength(3);
      expect(writes(seen)).toHaveLength(1);
      expect(writes(seen)[0]).toMatchObject({
        method: 'POST',
        path: '/api/podiums',
        body: {
          eventName: 'Lutte filles 52 kg',
          discipline: 'Lutte',
          gold: 'SEN',
          silver: 'JPN',
          bronze: 'FRA',
        },
      });
      expect(screen.getByRole('link', { name: /Voir les résultats du/ })).toBeVisible();
    },
    SLOW_FIRST_RENDER_MS,
  );

  it(
    '001-AS2: refuses a second podium for the same event, with a message tied to the Épreuve field',
    async () => {
      const user = userEvent.setup();
      seedPodium({ eventName: 'Lutte filles 52 kg', day: '2026-11-05' });
      await open();
      await fill(user, wrestling);
      await user.clear(screen.getByLabelText('Jour'));
      await user.type(screen.getByLabelText('Jour'), '2026-11-05');
      await submit(user);
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Cette épreuve a déjà un podium.');
      expect(alert).toHaveTextContent('Le podium enregistré n’a pas changé.');
      const field = screen.getByLabelText('Épreuve');
      expect(field).toHaveAttribute('aria-invalid', 'true');
      const describedBy = (field.getAttribute('aria-describedby') ?? '').split(' ');
      expect(describedBy).toContain('nom-err');
      expect(document.getElementById('nom-err')).toHaveTextContent('utilisez la correction');
      expect(describedByTargetsExist()).toEqual([]);
      expect(within(alert).getByRole('link', { name: 'Corriger ce podium' })).toBeVisible();
      expect(within(alert).getByRole('link', { name: 'Voir le podium enregistré' })).toBeVisible();
      expect(axeFindings(await runAxe())).toEqual([]);
    },
    SLOW_FIRST_RENDER_MS,
  );

  it('007-AS4: refuses an event typed with a curly apostrophe that was already published, with the conflict message', async () => {
    const user = userEvent.setup();
    seedPodium({ eventName: "Swimming – Women's 50m Freestyle", day: '2026-11-05' });
    await open();
    await fill(user, { ...wrestling, nom: 'Swimming - Women’s 50m Freestyle', disc: 'Swimming' });
    await user.clear(screen.getByLabelText('Jour'));
    await user.type(screen.getByLabelText('Jour'), '2026-11-05');
    await submit(user);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Cette épreuve a déjà un podium.');
    expect(fixture.podiums).toHaveLength(1);
  });

  it('001-AS3: refuses a repeated country and names it on both lines', async () => {
    const user = userEvent.setup();
    await open();
    await fill(user, { ...wrestling, ar: 'SEN' });
    await submit(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Un pays ne peut pas figurer deux fois.');
    expect(alert).toHaveTextContent('SEN apparaît en or et en argent.');
    expect(alert).toHaveTextContent('Aucun podium n’a été enregistré');
    expect(screen.getByLabelText(/Pays de l’or/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Pays de l’argent/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Pays du bronze/)).not.toHaveAttribute('aria-invalid');
    expect(describedByTargetsExist()).toEqual([]);
  });

  it('refuses an incomplete entry without calling the server, and says what to fix', async () => {
    const user = userEvent.setup();
    const seen = trackRequests();
    await open();
    await fill(user, { disc: 'Lutte', or: 'SEN', ar: 'JPN', br: 'SE' });
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('2 champs à corriger.');
    expect(document.getElementById('nom-err')).toHaveTextContent('Indiquez le nom de l’épreuve.');
    expect(document.getElementById('pays-bronze-err')).toHaveTextContent(
      '« SE » n’est pas un code pays : trois lettres, par exemple SEN.',
    );
    expect(describedByTargetsExist()).toEqual([]);
    expect(writes(seen)).toHaveLength(0);
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('keeps the typed entry after the page is closed and reopened', async () => {
    const user = userEvent.setup();
    await open();
    await fill(user, { nom: 'Lutte filles 52 kg', or: 'SEN' });
    cleanup();
    await open();
    expect(screen.getByLabelText('Épreuve')).toHaveValue('Lutte filles 52 kg');
    expect(screen.getByLabelText(/Pays de l’or/)).toHaveValue('SEN');
  });

  it('refuses a day outside the Games without calling the server', async () => {
    const user = userEvent.setup();
    const seen = trackRequests();
    await open();
    await fill(user, wrestling);
    fireEvent.change(screen.getByLabelText('Jour'), { target: { value: '2026-12-25' } });
    await submit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('1 champ à corriger.');
    expect(screen.getByLabelText('Jour')).toHaveAttribute('aria-invalid', 'true');
    expect(writes(seen)).toHaveLength(0);
  });

  it('shows the busy state while the podium is being sent', async () => {
    const user = userEvent.setup();
    mockControl.setLatency(300);
    await open();
    await fill(user, wrestling);
    await submit(user);
    const button = await screen.findByRole('button', { name: 'Enregistrement en cours…' });
    expect(button).toBeDisabled();
    expect(button.closest('form')).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByText('Podium enregistré.')).toBeVisible();
  });

  it('explains a server outage in plain words and keeps what was typed', async () => {
    const user = userEvent.setup();
    mockControl.failNext('POST /api/podiums');
    await open();
    await fill(user, wrestling);
    await submit(user);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le podium n’a pas été enregistré.');
    expect(screen.getByLabelText('Épreuve')).toHaveValue('Lutte filles 52 kg');
  });

  it('previews the podium live, and keeps a very long word or blank spaces inside the card', async () => {
    const user = userEvent.setup();
    await open();
    const preview = screen.getByRole('region', { name: 'Aperçu avant enregistrement' });
    expect(within(preview).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Épreuve à saisir',
    );
    await user.type(screen.getByLabelText('Épreuve'), '    ');
    expect(within(preview).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Épreuve à saisir',
    );
    await user.clear(screen.getByLabelText('Épreuve'));
    await user.type(screen.getByLabelText('Épreuve'), 'x'.repeat(100));
    expect(within(preview).getByRole('heading', { level: 3 })).toHaveTextContent('x'.repeat(100));
    await user.type(screen.getByLabelText(/Pays de l’or/), 'sen');
    expect(within(preview).getByText('SEN')).toBeVisible();
  });

  it('disables the button and says why when the network is down', async () => {
    await open();
    setOnline(false);
    const button = await screen.findByRole('button', { name: 'Enregistrer (connexion requise)' });
    expect(button).toBeDisabled();
  });

  it('lists the podiums already recorded that day, each with a link to correct it', async () => {
    const day = new Date().toISOString().slice(0, 10);
    const podium = seedPodium({ eventName: 'Lutte garçons 65 kg', day });
    await open();
    const link = await screen.findByRole('link', { name: /Lutte garçons 65 kg/ });
    await waitFor(() => expect(link).toHaveAttribute('href', `/journaliste/corriger/${podium.id}`));
  });

  it('has no accessibility violation on the empty form', async () => {
    await open();
    await screen.findByRole('button', { name: 'Enregistrer le podium' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});
