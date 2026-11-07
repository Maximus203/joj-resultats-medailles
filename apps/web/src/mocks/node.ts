import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Le serveur MSW des tests (démarré par `test/setup.ts`), avec les handlers de l'API. */
export const server = setupServer(...handlers);
