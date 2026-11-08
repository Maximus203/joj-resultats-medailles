import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const SCRAPING_ERROR_KINDS = {
  /** Une exécution de l'import est déjà en cours. */
  SCRAPE_ALREADY_RUNNING: 'CONFLICT',
} as const satisfies Record<string, ErrorKind>;

export type ScrapingErrorCode = keyof typeof SCRAPING_ERROR_KINDS;

export class ScrapingError extends AppError<ScrapingErrorCode> {
  constructor(code: ScrapingErrorCode, message: string) {
    super(code, SCRAPING_ERROR_KINDS[code], message);
  }
}

export function scrapeAlreadyRunning(): ScrapingError {
  return new ScrapingError(
    'SCRAPE_ALREADY_RUNNING',
    'Un import est déjà en cours : attends qu’il se termine avant d’en lancer un autre.',
  );
}
