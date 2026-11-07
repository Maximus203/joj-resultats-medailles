import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const PODIUM_ERROR_KINDS = {
  /** L'épreuve a déjà un podium enregistré. */
  PODIUM_ALREADY_RECORDED: 'CONFLICT',
  /** Deux des trois médaillés sont le même pays. */
  PODIUM_COUNTRIES_NOT_DISTINCT: 'BUSINESS_RULE',
} as const satisfies Record<string, ErrorKind>;

export type PodiumErrorCode = keyof typeof PODIUM_ERROR_KINDS;

export class PodiumError extends AppError<PodiumErrorCode> {
  constructor(code: PodiumErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, PODIUM_ERROR_KINDS[code], message, details);
  }
}

export function podiumAlreadyRecorded(eventName: string): PodiumError {
  return new PodiumError(
    'PODIUM_ALREADY_RECORDED',
    `A podium is already recorded for ${eventName}`,
    { eventName },
  );
}

export function podiumCountriesNotDistinct(): PodiumError {
  return new PodiumError(
    'PODIUM_COUNTRIES_NOT_DISTINCT',
    'The gold, silver and bronze medallists must be three different countries',
  );
}
