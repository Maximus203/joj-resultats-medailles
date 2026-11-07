import { createRouter, type RouterHistory } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

/** `history` : l'historique du navigateur par défaut, un historique en mémoire dans les tests. */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({ routeTree, defaultPreload: 'intent', history });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
