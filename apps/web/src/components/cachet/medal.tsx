export type MedalKind = 'or' | 'argent' | 'bronze';

export const MEDAL_WORD: Record<MedalKind, string> = {
  or: 'Or',
  argent: 'Argent',
  bronze: 'Bronze',
};
const MEDAL_RANK: Record<MedalKind, string> = { or: '1', argent: '2', bronze: '3' };

/** Pastille 1, 2, 3 : la couleur n'est jamais seule (chiffre, trame et contour). */
export function MedalPill({ kind }: { kind: MedalKind }) {
  return (
    <span className={`med med-${kind}`} aria-hidden="true">
      {kind === 'bronze' ? <span>{MEDAL_RANK[kind]}</span> : MEDAL_RANK[kind]}
    </span>
  );
}

/** Plaque de trois lettres : tient lieu de drapeau. */
export function CountryPlate({ code }: { code: string }) {
  return <span className="plaque">{code}</span>;
}
