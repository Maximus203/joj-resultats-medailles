import type { DisciplineResponse } from '@joj/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';

interface DeleteDisciplineButtonProps {
  discipline: DisciplineResponse;
  /** Appelé seulement après confirmation dans la boîte de dialogue. */
  onConfirm: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

/** Bouton Supprimer : demande confirmation avant de supprimer (AlertDialog shadcn). */
export function DeleteDisciplineButton({
  discipline,
  onConfirm,
  disabled,
  size = 'sm',
}: DeleteDisciplineButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="text-destructive"
          aria-label={`Supprimer ${discipline.name}`}
          disabled={disabled}
        >
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {discipline.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            La discipline sera supprimée définitivement. Cette action ne peut pas être annulée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={onConfirm}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
