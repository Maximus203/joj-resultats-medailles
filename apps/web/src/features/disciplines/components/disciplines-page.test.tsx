/**
 * La page /disciplines, montée par sa vraie route sur la fausse API (`mocks/handlers.ts`) :
 * liste, création, modification en place et suppression confirmée. Chaque test vérifie ce que
 * l'écran affiche et ce qui est parti sur le réseau (`trackRequests`).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockControl } from '@/mocks/control';
import { fixture, lutte } from '@/mocks/fixture';
import { renderRoute, trackRequests, writes } from '@/test/utils';

async function open() {
  const user = userEvent.setup();
  const seen = trackRequests();
  await renderRoute({ initialEntries: ['/disciplines'] });
  return { user, seen };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, name: string, category: string) {
  if (name) await user.type(screen.getByLabelText('Nom'), name);
  await user.selectOptions(screen.getByLabelText('Catégorie'), category);
  await user.click(screen.getByRole('button', { name: 'Ajouter' }));
}

async function startEditing(name: string) {
  const opened = await open();
  await opened.user.click(await screen.findByRole('button', { name: `Modifier ${name}` }));
  return opened;
}

async function confirmDeletion(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(await screen.findByRole('button', { name: `Supprimer ${name}` }));
  const dialog = await screen.findByRole('alertdialog', { name: `Supprimer « ${name} » ?` });
  await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
}

describe('DisciplinesPage', () => {
  it('000-AS5: shows the disciplines returned by the API, sorted by name, with their category', async () => {
    await open();

    const list = await screen.findByRole('list', { name: 'Disciplines' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.getAttribute('aria-label'))).toEqual(['Lutte', 'Natation']);
    expect(items[0]).toHaveTextContent('Sports de combat');
  });

  it('000-AS5: says when there is no discipline yet', async () => {
    fixture.disciplines = [];
    await open();
    expect(await screen.findByText('Aucune discipline pour l’instant.')).toBeInTheDocument();
  });

  it('000-AS5: shows a loading state, then an error when the list cannot be loaded', async () => {
    mockControl.setLatency(50);
    mockControl.failNext('GET /api/disciplines');
    await open();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible de charger les disciplines.',
    );
  });

  it('000-AS1: creates a discipline and shows it in the list', async () => {
    const { user, seen } = await open();
    await screen.findByRole('list', { name: 'Disciplines' });

    await fillForm(user, 'Escrime', 'sports-de-combat');

    expect(await screen.findByRole('listitem', { name: 'Escrime' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toHaveValue('');
    expect(writes(seen)).toEqual([
      {
        method: 'POST',
        path: '/api/disciplines',
        body: { name: 'Escrime', category: 'sports-de-combat' },
      },
    ]);
  });

  it('000-AS2: rejects a discipline without a name, without calling the API', async () => {
    const { user, seen } = await open();
    await screen.findByRole('list', { name: 'Disciplines' });

    await fillForm(user, '', 'athletisme');

    expect(await screen.findByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(writes(seen)).toEqual([]);
  });

  it('000-AS4: shows the API error when the name is already taken', async () => {
    const { user } = await open();
    await screen.findByRole('list', { name: 'Disciplines' });

    await fillForm(user, 'Lutte', 'sports-de-combat');

    expect(await screen.findByRole('alert')).toHaveTextContent('Une discipline porte déjà ce nom.');
  });

  it('000-AS6: opens the detail page of a discipline from the list', async () => {
    const { user } = await open();

    await user.click(await screen.findByRole('link', { name: 'Lutte' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Lutte' })).toBeInTheDocument();
  });

  it('000-AS7: edits the name and the category of a discipline in place', async () => {
    const { user, seen } = await startEditing('Lutte');

    const name = screen.getByLabelText('Nouveau nom');
    expect(name).toHaveValue('Lutte');
    await user.clear(name);
    await user.type(name, 'Lutte sénégalaise');
    await user.selectOptions(screen.getByLabelText('Nouvelle catégorie'), 'athletisme');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const item = await screen.findByRole('listitem', { name: 'Lutte sénégalaise' });
    expect(item).toHaveTextContent('Athlétisme');
    expect(screen.queryByLabelText('Nouveau nom')).not.toBeInTheDocument();
    expect(writes(seen)).toEqual([
      {
        method: 'PATCH',
        path: `/api/disciplines/${lutte.id}`,
        body: { name: 'Lutte sénégalaise', category: 'athletisme' },
      },
    ]);
  });

  it('000-AS7: cancels an edit without calling the API', async () => {
    const { user, seen } = await startEditing('Lutte');

    await user.type(screen.getByLabelText('Nouveau nom'), ' modifiée');
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.getByRole('listitem', { name: 'Lutte' })).toBeInTheDocument();
    expect(writes(seen)).toEqual([]);
  });

  it('000-AS8: rejects an empty name in the edit form, without calling the API', async () => {
    const { user, seen } = await startEditing('Lutte');

    await user.clear(screen.getByLabelText('Nouveau nom'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Le nom est obligatoire.')).toBeInTheDocument();
    expect(writes(seen)).toEqual([]);
  });

  it('000-AS9: shows the API error when the new name is taken by another discipline', async () => {
    const { user } = await startEditing('Lutte');

    await user.clear(screen.getByLabelText('Nouveau nom'));
    await user.type(screen.getByLabelText('Nouveau nom'), 'Natation');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Une discipline porte déjà ce nom.');
    expect(screen.getByLabelText('Nouveau nom')).toHaveValue('Natation');
  });

  it('000-AS10: deletes a discipline after confirmation and removes it from the list', async () => {
    const { user, seen } = await open();

    await confirmDeletion(user, 'Lutte');

    await waitFor(() =>
      expect(screen.queryByRole('listitem', { name: 'Lutte' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('listitem', { name: 'Natation' })).toBeInTheDocument();
    expect(writes(seen)).toEqual([
      { method: 'DELETE', path: `/api/disciplines/${lutte.id}`, body: undefined },
    ]);
  });

  it('000-AS10: keeps the discipline when the deletion is cancelled', async () => {
    const { user, seen } = await open();

    await user.click(await screen.findByRole('button', { name: 'Supprimer Lutte' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.getByRole('listitem', { name: 'Lutte' })).toBeInTheDocument();
    expect(writes(seen)).toEqual([]);
  });

  it('000-AS11: says when the discipline was deleted by someone else in the meantime', async () => {
    const { user } = await open();
    await screen.findByRole('listitem', { name: 'Lutte' });
    // Supprimée côté serveur après l'affichage de la liste.
    fixture.disciplines = fixture.disciplines.filter((d) => d.id !== lutte.id);

    await confirmDeletion(user, 'Lutte');

    expect(await screen.findByRole('alert')).toHaveTextContent('Cette discipline n’existe plus.');
  });
});
