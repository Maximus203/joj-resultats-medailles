/**
 * Quelques noms de pays pour le confort de lecture. Aucune liste officielle n'est vérifiée
 * (spec 001) : un code absent d'ici s'affiche sans nom, sur sa seule plaque.
 */
const NAMES: Record<string, string> = {
  ALG: 'Algérie',
  ARG: 'Argentine',
  AUS: 'Australie',
  BRA: 'Brésil',
  CAN: 'Canada',
  CHN: 'Chine',
  CIV: 'Côte d’Ivoire',
  CMR: 'Cameroun',
  EGY: 'Égypte',
  ESP: 'Espagne',
  ETH: 'Éthiopie',
  FRA: 'France',
  GBR: 'Royaume-Uni',
  GER: 'Allemagne',
  GHA: 'Ghana',
  ITA: 'Italie',
  JPN: 'Japon',
  KEN: 'Kenya',
  KOR: 'Corée du Sud',
  MAR: 'Maroc',
  MLI: 'Mali',
  NGR: 'Nigeria',
  SEN: 'Sénégal',
  TUN: 'Tunisie',
  USA: 'États-Unis',
};

export function countryName(code: string): string | undefined {
  return NAMES[code];
}

/** « SEN · Sénégal », ou « SEN » quand le nom n'est pas connu. */
export function countryLabel(code: string): string {
  const name = countryName(code);
  return name ? `${code} · ${name}` : code;
}

/** Les pays proposés dans « Mon pays » : ceux du tableau, plus les pays connus. */
export function countryOptions(presentCodes: readonly string[]): string[] {
  return [...new Set([...Object.keys(NAMES), ...presentCodes])].sort();
}
