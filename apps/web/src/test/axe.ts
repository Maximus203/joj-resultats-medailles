import * as axeCore from 'axe-core';

/**
 * Un audit axe-core de la page entière. La racine est toujours `document.body`, jamais le
 * conteneur de Testing Library : une boîte de dialogue Radix (`AlertDialog`) est rendue dans un
 * portal, hors de ce conteneur, et un audit limité au conteneur ne la verrait pas.
 *
 * `body` et non `documentElement` : sur `documentElement`, axe juge un document entier
 * (`page-has-heading-one`, `landmark-one-main`...), ce qu'un test d'écran ne cherche pas à dire.
 * Un seul rendu par test (`cleanup()` dans `test/setup.ts`) : le body ne contient que lui.
 *
 * `color-contrast` est coupé : jsdom n'applique pas de CSS (`css: false`), le contraste ne
 * peut pas y être mesuré. Il se vérifie dans un vrai navigateur.
 */
export async function runAxe(): Promise<axeCore.AxeResults> {
  return axeCore.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
}

/**
 * Ce dont un audit doit revenir vide : les violations, plus `duplicate-id-aria`, qu'axe range
 * dans `incomplete` (« à revoir ») même quand il est certain. Les résultats complets sont
 * renvoyés, pour qu'un échec affiche le HTML fautif et l'explication d'axe.
 */
export function axeFindings(results: axeCore.AxeResults): axeCore.Result[] {
  return [
    ...results.violations,
    ...results.incomplete.filter((result) => result.id === 'duplicate-id-aria'),
  ];
}
