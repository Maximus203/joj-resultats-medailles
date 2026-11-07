import {
  createDisciplineSchema,
  DISCIPLINE_CATEGORIES,
  type DisciplineCategory,
} from '@joj/shared';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useCreateDiscipline } from '../api/disciplines.queries';
import { CATEGORY_LABELS } from './category-labels';
import { errorMessage } from './error-message';

export function DisciplineForm() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DisciplineCategory>('athletisme');
  const [nameError, setNameError] = useState<string | null>(null);
  const createDiscipline = useCreateDiscipline();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Même schéma que l'API (packages/shared) : l'erreur s'affiche sans aller-retour réseau.
    const parsed = createDisciplineSchema.safeParse({ name, category });
    if (!parsed.success) {
      setNameError('Le nom est obligatoire.');
      return;
    }
    setNameError(null);
    createDiscipline.mutate(parsed.data, { onSuccess: () => setName('') });
  }

  const apiError = createDiscipline.error;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="discipline-name">Nom</Label>
        <Input
          id="discipline-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? 'discipline-name-error' : undefined}
        />
        {nameError && (
          <p id="discipline-name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:w-56">
        <Label htmlFor="discipline-category">Catégorie</Label>
        <NativeSelect
          id="discipline-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as DisciplineCategory)}
        >
          {DISCIPLINE_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={createDiscipline.isPending}>
        Ajouter
      </Button>
      {apiError && (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          {errorMessage(apiError)}
        </p>
      )}
    </form>
  );
}
