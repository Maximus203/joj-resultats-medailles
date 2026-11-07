/**
 * Le bouton Supprimer seul (`renderWithProviders`) : il ne supprime rien sans confirmation.
 * Qui supprime, et quoi faire ensuite, c'est le rôle de la liste ou de la page de détail.
 */
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { lutte } from '@/mocks/fixture';
import { renderWithProviders } from '@/test/utils';
import { DeleteDisciplineButton } from './delete-discipline-button';

function setup() {
  const onConfirm = vi.fn<() => void>();
  renderWithProviders(<DeleteDisciplineButton discipline={lutte} onConfirm={onConfirm} />);
  return { onConfirm, user: userEvent.setup() };
}

describe('DeleteDisciplineButton', () => {
  it('000-AS10: asks for confirmation, naming the discipline, before calling onConfirm', async () => {
    const { onConfirm, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Supprimer Lutte' }));

    const dialog = await screen.findByRole('alertdialog', { name: 'Supprimer « Lutte » ?' });
    expect(dialog).toHaveAccessibleDescription(/ne peut pas être annulée/);
    expect(onConfirm).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('000-AS10: does nothing when the dialog is dismissed with Escape', async () => {
    const { onConfirm, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Supprimer Lutte' }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Supprimer Lutte' })).toHaveFocus();
  });
});
