import type { DisciplineResponse } from '@joj/shared';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDeleteDiscipline } from '../api/disciplines.queries';
import { CATEGORY_LABELS } from './category-labels';
import { DeleteDisciplineButton } from './delete-discipline-button';
import { DisciplineEditForm } from './discipline-edit-form';
import { errorMessage } from './error-message';

export function DisciplineList({ disciplines }: { disciplines: DisciplineResponse[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // Au niveau de la liste : le message reste visible si la ligne disparaît après la relecture.
  const deleteDiscipline = useDeleteDiscipline();

  return (
    <div className="flex flex-col gap-2">
      {deleteDiscipline.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(deleteDiscipline.error)}
        </p>
      )}
      {disciplines.length === 0 ? (
        <p className="text-muted-foreground">Aucune discipline pour l’instant.</p>
      ) : (
        <ul aria-label="Disciplines" className="divide-y rounded-md border">
          {disciplines.map((discipline) => (
            <li key={discipline.id} aria-label={discipline.name} className="px-4 py-3">
              {editingId === discipline.id ? (
                <DisciplineEditForm discipline={discipline} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <Link
                    to="/disciplines/$disciplineId"
                    params={{ disciplineId: discipline.id }}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {discipline.name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {CATEGORY_LABELS[discipline.category]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Modifier ${discipline.name}`}
                      onClick={() => setEditingId(discipline.id)}
                    >
                      Modifier
                    </Button>
                    <DeleteDisciplineButton
                      discipline={discipline}
                      disabled={deleteDiscipline.isPending}
                      onConfirm={() => deleteDiscipline.mutate(discipline.id)}
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
