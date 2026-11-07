import { ApiError } from '@/lib/api';

/** Messages affichés pour les codes d'erreur de l'API ; les autres gardent un message générique. */
const ERROR_MESSAGES: Record<string, string> = {
  DISCIPLINE_NAME_TAKEN: 'Une discipline porte déjà ce nom.',
  DISCIPLINE_NOT_FOUND: 'Cette discipline n’existe plus.',
  VALIDATION_FAILED: 'Vérifiez le nom et la catégorie.',
};

export function errorMessage(error: unknown): string {
  return (
    (error instanceof ApiError && ERROR_MESSAGES[error.code]) ||
    'Une erreur est survenue. Réessayez.'
  );
}
