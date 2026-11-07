import { CountryPlate, MEDAL_WORD, MedalPill, type MedalKind } from '@/components/cachet/medal';

const KINDS: MedalKind[] = ['or', 'argent', 'bronze'];

/** Les trois lignes d'un podium : médaille, mot, plaque du pays. */
export function PodiumLines({
  gold,
  silver,
  bronze,
}: {
  gold: string;
  silver: string;
  bronze: string;
}) {
  const codes = [gold, silver, bronze];
  return (
    <ol className="podium">
      {KINDS.map((kind, index) => (
        <li key={kind}>
          <MedalPill kind={kind} />
          <span className="mot">{MEDAL_WORD[kind]}</span>
          <CountryPlate code={codes[index] ?? ''} />
        </li>
      ))}
    </ol>
  );
}
