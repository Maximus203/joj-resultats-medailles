import type { OfficialSource } from '../domain/official-results';

/**
 * Port : le site officiel des résultats. Implémenté par HttpResultsSource (infra) ; les tests en
 * donnent une version simulée, aucun test ne touche le réseau.
 */
export abstract class ResultsSource implements OfficialSource {
  abstract schedule(day: string): Promise<string>;
  abstract medalList(code: string): Promise<string>;
}
