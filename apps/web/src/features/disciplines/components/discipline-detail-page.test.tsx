/**
 * La page /disciplines/:id, montée par sa vraie route sur la fausse API : affichage,
 * modification, suppression confirmée qui ramène à la liste, et discipline introuvable.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { lutte, UNKNOWN_ID } from '@/mocks/fixture';
import { renderRoute, trackRequests, writes } from '@/test/utils';

async function open(id: string) {
  const user = userEvent.setup();
  const seen = trackRequests();
  const { router } = await renderRoute({ initialEntries: [`/disciplines/${id}`] });
  return { user, seen, router };
}

describe('DisciplineDetailPage', () => {
  it('000-AS6: shows the name, the category and the creation date of a discipline', async () => {
    await open(lutte.id);

    expect(await screen.findByRole('heading', { level: 1, name: 'Lutte' })).toBeInTheDocument();
    expect(screen.getByText('Sports de combat')).toBeInTheDocument();
    expect(screen.getByText('1 octobre 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Toutes les disciplines' })).toHaveAttribute(
      'href',
      '/disciplines',
    );
  });

  it('000-AS7: edits the discipline from its detail page', async () => {
    const { user, seen } = await open(lutte.id);

    await user.click(await screen.findByRole('button', { name: 'Modifier' }));
    await user.clear(screen.getByLabelText('Nouveau nom'));
    await user.type(screen.getByLabelText('Nouveau nom'), 'Lutte sénégalaise');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lutte sénégalaise' }),
    ).toBeInTheDocument();
    expect(writes(seen)).toEqual([
      {
        method: 'PATCH',
        path: `/api/disciplines/${lutte.id}`,
        body: { name: 'Lutte sénégalaise', category: 'sports-de-combat' },
      },
    ]);
  });

  it('000-AS10: deletes the discipline after confirmation and goes back to the list', async () => {
    const { user, seen, router } = await open(lutte.id);

    await user.click(await screen.findByRole('button', { name: 'Supprimer Lutte' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Supprimer « Lutte » ?' });
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/disciplines'));
    expect(await screen.findByRole('listitem', { name: 'Natation' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: 'Lutte' })).not.toBeInTheDocument();
    expect(writes(seen)).toEqual([
      { method: 'DELETE', path: `/api/disciplines/${lutte.id}`, body: undefined },
    ]);
  });

  it('000-AS11: says when the discipline does not exist', async () => {
    await open(UNKNOWN_ID);

    expect(await screen.findByRole('alert')).toHaveTextContent('Cette discipline n’existe plus.');
    expect(screen.getByRole('link', { name: 'Toutes les disciplines' })).toBeInTheDocument();
  });
});
