import type { MedalRow } from '@joj/shared';
import { CountryPlate, MedalPill } from '@/components/cachet/medal';
import { countryName } from '@/lib/countries';

/** Rang « à la compétition » : un rang partagé s'annonce « ex æquo ». */
function sharesRank(rows: readonly MedalRow[], index: number): boolean {
  const row = rows[index];
  if (!row) return false;
  return rows.some((other, otherIndex) => otherIndex !== index && other.rank === row.rank);
}

const cell = (value: number, extra = '') => {
  const classes = [extra, value === 0 ? 'zero' : ''].filter(Boolean).join(' ');
  return classes || undefined;
};

export function MedalTable({
  rows,
  caption,
  myCountry,
  compact = false,
}: {
  rows: readonly MedalRow[];
  caption: string;
  myCountry: string | null;
  compact?: boolean;
}) {
  return (
    <div className="tableau-defil">
      <table className={compact ? 'tableau tableau-compact' : 'tableau'}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visuellement-cache">Rang</span>
              <span aria-hidden="true">N°</span>
            </th>
            <th scope="col">Pays</th>
            <th scope="col">
              <MedalPill kind="or" />
              <span className="visuellement-cache">Médailles d’or</span>
              <span aria-hidden="true">Or</span>
            </th>
            <th scope="col">
              <MedalPill kind="argent" />
              <span className="visuellement-cache">Médailles d’argent</span>
              <span aria-hidden="true">Ar</span>
            </th>
            <th scope="col">
              <MedalPill kind="bronze" />
              <span className="visuellement-cache">Médailles de bronze</span>
              <span aria-hidden="true">Br</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const tied = sharesRank(rows, index);
            const name = countryName(row.country);
            return (
              <tr key={row.country} className={row.country === myCountry ? 'mon-pays' : undefined}>
                <th scope="row" className="rang">
                  <span className="visuellement-cache">Rang </span>
                  {row.rank}
                  {tied ? <small>ex æquo</small> : null}
                </th>
                <td className="pays">
                  <CountryPlate code={row.country} />
                  {!compact && name ? <span className="nom">{name}</span> : null}
                  {row.country === myCountry ? (
                    <span className="visuellement-cache"> (mon pays)</span>
                  ) : null}
                </td>
                <td className={cell(row.gold, 'or')}>{row.gold}</td>
                <td className={cell(row.silver)}>{row.silver}</td>
                <td className={cell(row.bronze)}>{row.bronze}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Les cinq premiers pays, plus « Mon pays » s'il est plus loin. */
export function compactRows(rows: readonly MedalRow[], myCountry: string | null): MedalRow[] {
  const top = rows.slice(0, 5);
  const mine = myCountry ? rows.find((row) => row.country === myCountry) : undefined;
  return mine && !top.includes(mine) ? [...top, mine] : top;
}
