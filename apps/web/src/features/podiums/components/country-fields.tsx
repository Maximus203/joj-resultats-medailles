import { Icon } from '@/components/cachet/icons';
import { MEDAL_WORD, MedalPill, type MedalKind } from '@/components/cachet/medal';
import { type CountryField, type CountryValues, type FieldErrors } from '../podium-messages';

const COUNTRY_LABEL: Record<CountryField, string> = {
  gold: 'Pays de l’or',
  silver: 'Pays de l’argent',
  bronze: 'Pays du bronze',
};

const LINES: { field: CountryField; kind: MedalKind; placeholder: string }[] = [
  { field: 'gold', kind: 'or', placeholder: 'SEN' },
  { field: 'silver', kind: 'argent', placeholder: 'JPN' },
  { field: 'bronze', kind: 'bronze', placeholder: 'FRA' },
];

export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <span className="msg-erreur" id={id}>
      <Icon name="erreur" />
      {children}
    </span>
  );
}

/** Les trois pays d'un podium : trois lignes identiques, un message relié à chaque ligne en cause. */
export function CountryFields({
  values,
  errors,
  originals,
  disabled,
  onChange,
}: {
  values: CountryValues;
  errors: FieldErrors;
  /** Correction : les pays publiés, pour signaler « Était : … » sur un champ modifié. */
  originals?: CountryValues;
  disabled?: boolean;
  onChange: (field: CountryField, value: string) => void;
}) {
  return (
    <fieldset className="groupe">
      <legend>Podium</legend>
      {LINES.map(({ field, kind, placeholder }) => {
        const id = `pays-${field}`;
        const error = errors[field];
        const changed = originals !== undefined && values[field] !== originals[field];
        const describedBy = [
          changed ? `${id}-etait` : null,
          error ? `${id}-err` : null,
          'pays-aide',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <div className="ligne-medaille" key={field}>
            <div className="champ">
              <span className="etiquette lib-med">
                <MedalPill kind={kind} />
                {MEDAL_WORD[kind]}
              </span>
            </div>
            <div className="champ">
              <label className="visuellement-cache" htmlFor={id}>
                {COUNTRY_LABEL[field]}, trois lettres
              </label>
              <input
                className={`saisie saisie-code${changed ? ' change' : ''}`}
                id={id}
                value={values[field]}
                maxLength={3}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy}
                onChange={(event) => onChange(field, event.target.value.toUpperCase())}
              />
              {changed && originals ? (
                <span className="aide" id={`${id}-etait`}>
                  Était : {originals[field]}
                </span>
              ) : null}
              {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
            </div>
          </div>
        );
      })}
      <span className="aide" id="pays-aide">
        Code de trois lettres majuscules, comme SEN, JPN, FRA.
      </span>
    </fieldset>
  );
}
