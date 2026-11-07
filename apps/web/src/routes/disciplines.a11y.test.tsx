/**
 * Un audit axe-core de chaque état des écrans Disciplines : liste, formulaire en erreur,
 * modification en place, boîte de confirmation ouverte (rendue dans un portal), détail et
 * discipline introuvable. Un état qui n'est jamais audité peut régresser sans bruit.
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { lutte, UNKNOWN_ID } from '@/mocks/fixture';
import { axeFindings, runAxe } from '@/test/axe';
import { renderRoute } from '@/test/utils';

async function openList() {
  await renderRoute({ initialEntries: ['/disciplines'] });
  await screen.findByRole('list', { name: 'Disciplines' });
  return userEvent.setup();
}

describe('disciplines accessibility', () => {
  it('000-AS5: the list is clean', async () => {
    await openList();
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('000-AS2: the creation form is clean with a validation error', async () => {
    const user = await openList();
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    await screen.findByText('Le nom est obligatoire.');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('000-AS7: the list is clean with a row being edited', async () => {
    const user = await openList();
    await user.click(screen.getByRole('button', { name: 'Modifier Lutte' }));
    await screen.findByLabelText('Nouveau nom');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('000-AS10: the confirmation dialog is clean', async () => {
    const user = await openList();
    await user.click(screen.getByRole('button', { name: 'Supprimer Lutte' }));
    await screen.findByRole('alertdialog');
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('000-AS6: the detail page is clean', async () => {
    await renderRoute({ initialEntries: [`/disciplines/${lutte.id}`] });
    await screen.findByRole('heading', { level: 1, name: 'Lutte' });
    expect(axeFindings(await runAxe())).toEqual([]);
  });

  it('000-AS11: the not-found detail page is clean', async () => {
    await renderRoute({ initialEntries: [`/disciplines/${UNKNOWN_ID}`] });
    await screen.findByRole('alert');
    expect(axeFindings(await runAxe())).toEqual([]);
  });
});
