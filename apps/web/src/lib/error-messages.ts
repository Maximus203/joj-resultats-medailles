import { ApiError } from '@/lib/api';

/** La cause d'un échec de lecture, en français courant : jamais un code brut. */
export function describeLoadError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return 'Le serveur ne répond pas pour le moment. Vos données ne sont pas perdues.';
    }
    if (error.code === 'INVALID_RESPONSE') {
      return 'Le serveur a répondu de façon inattendue. Réessayez dans un instant.';
    }
    if (error.status >= 500)
      return 'Le serveur a rencontré un problème. Réessayez dans un instant.';
  }
  return 'Un problème est survenu. Réessayez dans un instant.';
}
