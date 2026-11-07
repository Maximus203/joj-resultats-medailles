import { countryCodeSchema } from '@joj/shared';
import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'joj.mon-pays';
const DEFAULT_COUNTRY = 'SEN';
const NONE = '-';
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === NONE) return null;
    const parsed = countryCodeSchema.safeParse(stored);
    return parsed.success ? parsed.data : DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

function write(code: string | null): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, code ?? NONE);
  } catch {
    // Stockage refusé (navigation privée) : le choix vaut pour la page en cours seulement.
  }
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** « Mon pays » : choisi sur l'appareil, sans compte. `null` quand l'utilisateur ne suit aucun pays. */
export function useMyCountry(): [string | null, (code: string | null) => void] {
  const code = useSyncExternalStore(subscribe, read, () => DEFAULT_COUNTRY);
  const set = useCallback((next: string | null) => write(next), []);
  return [code, set];
}
