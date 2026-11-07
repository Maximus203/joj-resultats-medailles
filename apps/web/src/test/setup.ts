import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { mockControl } from '@/mocks/control';
import { server } from '@/mocks/node';

// `findBy*` abandonne après 1 s par défaut. Le premier test d'un fichier qui monte une route
// transforme d'abord ses modules : sur une machine chargée, cela suffit à dépasser. Seule
// l'attente est allongée ; une requête qui ne peut pas réussir échoue toujours.
configure({ asyncUtilTimeout: 3000 });

// jsdom n'implémente pas `scrollTo`, que le router appelle à chaque navigation : sans ce stub,
// chaque test de route affiche un avertissement « Not implemented » qui noie le reste.
window.scrollTo = () => {};

// axe-core teste le rendu des icônes avec un canvas, que jsdom n'a pas : `null` est la réponse
// d'un navigateur sans canvas, et évite un avertissement par audit.
HTMLCanvasElement.prototype.getContext = () => null;

// Une requête qu'aucun handler ne connaît fait échouer le test : pas d'appel réseau caché.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  // Retire les `server.use(...)` d'un test : les handlers de `mocks/handlers.ts` reviennent.
  server.resetHandlers();
  // `resetHandlers()` ne retire pas les écouteurs `server.events.on(...)` (`trackRequests`) :
  // sans cela, un test compterait aussi les requêtes des tests suivants.
  server.events.removeAllListeners();
  // Latence, pannes armées et données d'origine : un test ne dépend jamais d'un autre.
  mockControl.reset();
});

afterAll(() => server.close());
