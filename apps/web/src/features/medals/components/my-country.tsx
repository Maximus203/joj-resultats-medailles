import type { MedalRow } from '@joj/shared';
import { Link } from '@tanstack/react-router';
import { CountryPlate } from '@/components/cachet/medal';
import { countryLabel, countryName, countryOptions } from '@/lib/countries';

export function MyCountrySelect({
  value,
  onChange,
  presentCodes,
}: {
  value: string | null;
  onChange: (code: string | null) => void;
  presentCodes: readonly string[];
}) {
  const options = countryOptions(value ? [...presentCodes, value] : presentCodes);
  return (
    <div className="champ">
      <label htmlFor="pays">Mon pays</label>
      <select
        className="saisie"
        id="pays"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Aucun</option>
        {options.map((code) => (
          <option key={code} value={code}>
            {countryLabel(code)}
          </option>
        ))}
      </select>
    </div>
  );
}

const ordinal = (rank: number) => (rank === 1 ? 'er' : 'e');

/** Rang et trois totaux du pays suivi ; un appui ouvre le tableau. */
export function MyCountryCard({ code, row }: { code: string; row: MedalRow | undefined }) {
  const gold = row?.gold ?? 0;
  const silver = row?.silver ?? 0;
  const bronze = row?.bronze ?? 0;
  const name = countryName(code) ?? code;
  const summary = row
    ? `${row.rank}${ordinal(row.rank)} au tableau des médailles, ${gold} or, ${silver} argent, ${bronze} bronze`
    : 'pas encore de médaille';
  return (
    <Link className="mon-pays-carte" to="/medailles" aria-label={`Mon pays : ${name}, ${summary}`}>
      <CountryPlate code={code} />
      <span className="rang-pays">
        <small>Rang</small>
        {row ? (
          <>
            {row.rank}
            <sup>{ordinal(row.rank)}</sup>
          </>
        ) : (
          '–'
        )}
      </span>
      <span className="totaux" aria-hidden="true">
        <span>
          <b>{gold}</b>
          <small>Or</small>
        </span>
        <span>
          <b>{silver}</b>
          <small>Ar.</small>
        </span>
        <span>
          <b>{bronze}</b>
          <small>Br.</small>
        </span>
      </span>
    </Link>
  );
}
