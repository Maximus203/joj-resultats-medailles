import { fileURLToPath } from 'node:url';

/** Racine du dépôt, quel que soit le dossier d'où le script est lancé. */
export const PROJECT_DIR = fileURLToPath(new URL('../../..', import.meta.url));
