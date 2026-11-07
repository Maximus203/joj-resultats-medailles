import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDisciplines } from '../api/disciplines.queries';
import { DisciplineForm } from './discipline-form';
import { DisciplineList } from './discipline-list';

export function DisciplinesPage() {
  const disciplines = useDisciplines();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Disciplines</h1>
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle discipline</CardTitle>
        </CardHeader>
        <CardContent>
          <DisciplineForm />
        </CardContent>
      </Card>
      {disciplines.isPending && <p className="text-muted-foreground">Chargement…</p>}
      {disciplines.isError && (
        <p role="alert" className="text-destructive">
          Impossible de charger les disciplines.
        </p>
      )}
      {disciplines.isSuccess && <DisciplineList disciplines={disciplines.data} />}
    </div>
  );
}
