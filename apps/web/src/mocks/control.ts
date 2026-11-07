import { resetFixture } from './fixture';

/**
 * Les leviers d'un test sur la fausse API. Un état de chargement a besoin de temps pour
 * exister, un état d'erreur a besoin d'une panne : une fausse API qui répond toujours tout de
 * suite et sans erreur rend ces deux états impossibles à tester.
 */
const state = {
  latency: 0,
  /** Une panne, consommée par la première requête qui la lit. */
  failures: new Map<string, number>(),
  /** Une panne qui dure jusqu'au `reset()` : le serveur est tombé. */
  persistentFailures: new Map<string, number>(),
};

export const mockControl = {
  get latency(): number {
    return state.latency;
  },

  /** Retarde chaque réponse, pour observer un état de chargement. */
  setLatency(ms: number): void {
    state.latency = ms;
  },

  /** La prochaine requête vers `path` (`GET /api/disciplines`) échoue, puis tout repart. */
  failNext(path: string, status = 500): void {
    state.failures.set(path, status);
  },

  /** Toutes les requêtes vers `path` échouent, jusqu'au `reset()`. */
  failPersistently(path: string, status = 500): void {
    state.persistentFailures.set(path, status);
  },

  /** Lu par les handlers : le statut de la panne armée pour `path`, ou `null`. */
  takeFailure(path: string): number | null {
    const persistent = state.persistentFailures.get(path);
    if (persistent !== undefined) return persistent;
    const once = state.failures.get(path);
    if (once === undefined) return null;
    state.failures.delete(path);
    return once;
  },

  /** Appelé après chaque test (`test/setup.ts`) : latence, pannes et données d'origine. */
  reset(): void {
    state.latency = 0;
    state.failures.clear();
    state.persistentFailures.clear();
    resetFixture();
  },
};
