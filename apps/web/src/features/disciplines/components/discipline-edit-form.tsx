import {
  DISCIPLINE_CATEGORIES,
  type DisciplineCategory,
  type DisciplineResponse,
  updateDisciplineSchema,
} from '@joj/shared';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useUpdateDiscipline } from '../api/disciplines.queries';
import { CATEGORY_LABELS } from './category-labels';
import { errorMessage } from './error-message';

interface DisciplineEditFormProps {
  discipline: DisciplineResponse;
  /** Appelé après l'enregistrement ou l'annulation. */
  onDone: () => void;
}

export function DisciplineEditForm({ discipline, onDone }: DisciplineEditFormProps) {
  const [name, setName] = useState(discipline.name);
  const [category, setCategory] = useState<DisciplineCategory>(discipline.category);
  const [nameError, setNameError] = useState<string | null>(null);
  const updateDiscipline = useUpdateDiscipline();
  const nameId = `edit-name-${discipline.id}`;
  const categoryId = `edit-category-${discipline.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Même schéma que l'API (packages/shared) : l'erreur s'affiche sans aller-retour réseau.
    const parsed = updateDisciplineSchema.safeParse({ name, category });
    if (!parsed.success) {
      setNameError('Le nom est obligatoire.');
      return;
    }
    setNameError(null);
    updateDiscipline.mutate({ id: discipline.id, input: parsed.data }, { onSuccess: onDone });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={nameId}>Nouveau nom</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError !== null}
          aria-describedby={nameError ? `${nameId}-error` : undefined}
        />
        {nameError && (
          <p id={`${nameId}-error`} className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:w-48">
        <Label htmlFor={categoryId}>Nouvelle catégorie</Label>
        <NativeSelect
          id={categoryId}
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
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateDiscipline.isPending}>
          Enregistrer
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {updateDiscipline.error && (
        <p role="alert" className="text-sm text-destructive sm:basis-full">
          {errorMessage(updateDiscipline.error)}
        </p>
      )}
    </form>
  );
}
