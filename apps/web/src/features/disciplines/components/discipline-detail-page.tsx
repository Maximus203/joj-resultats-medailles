import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { disciplineKeys, useDeleteDiscipline, useDiscipline } from '../api/disciplines.queries';
import { CATEGORY_LABELS } from './category-labels';
import { DeleteDisciplineButton } from './delete-discipline-button';
import { DisciplineEditForm } from './discipline-edit-form';
import { errorMessage } from './error-message';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

export function DisciplineDetailPage({ id }: { id: string }) {
  const discipline = useDiscipline(id);
  const deleteDiscipline = useDeleteDiscipline();
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleDelete() {
    deleteDiscipline.mutate(id, {
      onSuccess: async () => {
        await navigate({ to: '/disciplines' });
        // Une fois la page quittée : ne pas garder en cache une discipline supprimée.
        queryClient.removeQueries({ queryKey: disciplineKeys.detail(id) });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/disciplines" className="text-sm text-muted-foreground hover:underline">
        <span aria-hidden="true">←</span> Toutes les disciplines
      </Link>
      {discipline.isPending && <p className="text-muted-foreground">Chargement…</p>}
      {discipline.isError && (
        <p role="alert" className="text-destructive">
          {errorMessage(discipline.error)}
        </p>
      )}
      {discipline.isSuccess && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-2xl font-semibold">{discipline.data.name}</h1>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {editing ? (
              <DisciplineEditForm discipline={discipline.data} onDone={() => setEditing(false)} />
            ) : (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Catégorie</dt>
                  <dd>{CATEGORY_LABELS[discipline.data.category]}</dd>
                  <dt className="text-muted-foreground">Ajoutée le</dt>
                  <dd>{dateFormat.format(new Date(discipline.data.createdAt))}</dd>
                </dl>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Modifier
                  </Button>
                  <DeleteDisciplineButton
                    discipline={discipline.data}
                    size="default"
                    disabled={deleteDiscipline.isPending}
                    onConfirm={handleDelete}
                  />
                </div>
              </>
            )}
            {deleteDiscipline.error && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage(deleteDiscipline.error)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
