import { PODIUM_TEXT_MAX_LENGTH, recordPodiumSchema, correctPodiumSchema } from '@joj/shared';
import { ApiError } from '@/lib/api';
import { GAMES_FIRST_DAY, GAMES_LAST_DAY } from '@/lib/dates';

export type CountryField = 'gold' | 'silver' | 'bronze';
export type RecordField = 'eventName' | 'discipline' | 'day' | CountryField;
export type FieldErrors = Partial<Record<RecordField, string>>;

export interface RecordValues {
  eventName: string;
  discipline: string;
  day: string;
  gold: string;
  silver: string;
  bronze: string;
}
export type CountryValues = Pick<RecordValues, CountryField>;

export const MEDAL_LABEL: Record<CountryField, string> = {
  gold: 'or',
  silver: 'argent',
  bronze: 'bronze',
};
const COUNTRY_FIELDS: CountryField[] = ['gold', 'silver', 'bronze'];

/** Le message d'un champ invalide : quoi, pourquoi, que faire (cf. règles d'accessibilité du design). */
export function fieldMessage(field: RecordField, value: string): string {
  switch (field) {
    case 'eventName':
      return value.trim()
        ? `Le nom de l’épreuve ne dépasse pas ${PODIUM_TEXT_MAX_LENGTH} caractères.`
        : 'Indiquez le nom de l’épreuve.';
    case 'discipline':
      return value.trim()
        ? `La discipline ne dépasse pas ${PODIUM_TEXT_MAX_LENGTH} caractères.`
        : 'Indiquez la discipline.';
    case 'day':
      return value
        ? 'Le jour doit être compris entre le 31 octobre et le 13 novembre 2026.'
        : 'Choisissez le jour de l’épreuve.';
    default:
      return value
        ? `« ${value} » n’est pas un code pays : trois lettres, par exemple SEN.`
        : `Indiquez le pays de la médaille d’${MEDAL_LABEL[field]}, trois lettres, par exemple SEN.`;
  }
}

function isRecordField(path: string): path is RecordField {
  return ['eventName', 'discipline', 'day', ...COUNTRY_FIELDS].includes(path);
}

function errorsFromPaths(paths: string[], values: RecordValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const path of paths) {
    if (isRecordField(path)) errors[path] = fieldMessage(path, values[path]);
  }
  return errors;
}

/** Validation de saisie avec le schéma partagé ; le serveur reste l'autorité. */
export function validateRecord(values: RecordValues): FieldErrors {
  const parsed = recordPodiumSchema.safeParse(values);
  const paths = parsed.success ? [] : parsed.error.issues.map((issue) => String(issue.path[0]));
  const outsideGames = values.day < GAMES_FIRST_DAY || values.day > GAMES_LAST_DAY;
  if (values.day && outsideGames && !paths.includes('day')) paths.push('day');
  return errorsFromPaths(paths, values);
}

export function validateCountries(values: CountryValues): FieldErrors {
  const parsed = correctPodiumSchema.safeParse(values);
  if (parsed.success) return {};
  return errorsFromPaths(
    parsed.error.issues.map((issue) => String(issue.path[0])),
    { ...values, eventName: '', discipline: '', day: '' },
  );
}

/** Le premier pays qui revient, et les deux médailles où il apparaît. */
export function findRepeatedCountry(
  values: CountryValues,
): { code: string; first: CountryField; second: CountryField } | null {
  for (const [index, first] of COUNTRY_FIELDS.entries()) {
    for (const second of COUNTRY_FIELDS.slice(index + 1)) {
      if (values[first] && values[first] === values[second]) {
        return { code: values[first], first, second };
      }
    }
  }
  return null;
}

export interface Refusal {
  title: string;
  detail: string;
  fields: FieldErrors;
}

/** Ce que l'API refuse, en français selon le `code` RFC 9457. */
export function describeWriteError(
  error: unknown,
  values: RecordValues,
  context: 'record' | 'correct',
): Refusal {
  const none: FieldErrors = {};
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'PODIUM_ALREADY_RECORDED':
        return {
          title: 'Cette épreuve a déjà un podium.',
          detail: 'Le podium enregistré n’a pas changé. Pour le modifier, utilisez la correction.',
          fields: { eventName: 'Cette épreuve a déjà un podium : utilisez la correction.' },
        };
      case 'PODIUM_COUNTRIES_NOT_DISTINCT': {
        const repeated = findRepeatedCountry(values);
        const tail =
          context === 'record'
            ? 'Aucun podium n’a été enregistré pour cette épreuve.'
            : 'Le podium publié n’a pas changé.';
        if (!repeated) {
          return { title: 'Un pays ne peut pas figurer deux fois.', detail: tail, fields: none };
        }
        const { code, first, second } = repeated;
        return {
          title: 'Un pays ne peut pas figurer deux fois.',
          detail: `${code} apparaît en ${MEDAL_LABEL[first]} et en ${MEDAL_LABEL[second]}. ${tail}`,
          fields: {
            [first]: `${code} est aussi en ${MEDAL_LABEL[second]} : choisissez un autre pays.`,
            [second]: `${code} est aussi en ${MEDAL_LABEL[first]} : choisissez un autre pays.`,
          },
        };
      }
      case 'VALIDATION_FAILED': {
        const fields = errorsFromPaths(
          (error.errors ?? []).map((issue) => issue.path),
          values,
        );
        const count = Object.keys(fields).length;
        return {
          title: count === 1 ? '1 champ à corriger.' : `${count || 'Des'} champs à corriger.`,
          detail: 'Le serveur a refusé la saisie : vérifiez les champs signalés.',
          fields,
        };
      }
      case 'PODIUM_NOT_FOUND':
        return {
          title: 'Ce podium n’existe plus.',
          detail: 'Il a peut-être été retiré. Retournez aux résultats pour le retrouver.',
          fields: none,
        };
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return {
          title: 'Le serveur ne répond pas.',
          detail: 'Votre saisie est conservée : réessayez dans un instant.',
          fields: none,
        };
    }
  }
  return {
    title:
      context === 'record'
        ? 'Le podium n’a pas été enregistré.'
        : 'La correction n’a pas été publiée.',
    detail:
      'Un problème est survenu côté serveur. Votre saisie est conservée : réessayez dans un instant.',
    fields: none,
  };
}
