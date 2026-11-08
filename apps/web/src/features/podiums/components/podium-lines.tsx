import { CountryPlate, MEDAL_WORD, MedalPill, type MedalKind } from '@/components/cachet/medal';

/** Les lignes d'un podium : médaille, mot, plaque du pays ; un second bronze (judo, lutte) ajoute une ligne. */
export function PodiumLines({
  gold,
  silver,
  bronze,
  secondBronze,
}: {
  gold: string;
  silver: string;
  bronze: string;
  secondBronze?: string | null | undefined;
}) {
  const lines: [MedalKind, string][] = [
    ['or', gold],
    ['argent', silver],
    ['bronze', bronze],
    ...(secondBronze ? [['bronze', secondBronze] as [MedalKind, string]] : []),
  ];
  return (
    <ol className="podium">
      {lines.map(([kind, code], index) => (
        <li key={`${kind}-${index}`}>
          <MedalPill kind={kind} />
          <span className="mot">{MEDAL_WORD[kind]}</span>
          <CountryPlate code={code} />
        </li>
      ))}
    </ol>
  );
}
