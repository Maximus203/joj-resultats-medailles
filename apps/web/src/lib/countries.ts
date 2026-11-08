/**
 * Les noms de pays pour le confort de lecture : la source unique. Elle couvre les 68 pays vus à
 * l'import des résultats officiels (le test `countries.test.ts` échoue si l'un manque) ; un autre
 * code s'affiche sans nom, sur sa seule plaque.
 */
const NAMES: Record<string, string> = {
  ALG: 'Algérie',
  ARG: 'Argentine',
  AUS: 'Australie',
  AUT: 'Autriche',
  AZE: 'Azerbaïdjan',
  BDI: 'Burundi',
  BEL: 'Belgique',
  BLR: 'Biélorussie',
  BRA: 'Brésil',
  BUL: 'Bulgarie',
  CAN: 'Canada',
  CHN: 'Chine',
  CIV: 'Côte d’Ivoire',
  CMR: 'Cameroun',
  COD: 'RD Congo',
  COL: 'Colombie',
  CRO: 'Croatie',
  CUB: 'Cuba',
  CYP: 'Chypre',
  CZE: 'Tchéquie',
  ECU: 'Équateur',
  EGY: 'Égypte',
  ESP: 'Espagne',
  EST: 'Estonie',
  ETH: 'Éthiopie',
  FRA: 'France',
  GBR: 'Royaume-Uni',
  GEO: 'Géorgie',
  GER: 'Allemagne',
  GHA: 'Ghana',
  GRE: 'Grèce',
  HKG: 'Hong Kong',
  HUN: 'Hongrie',
  INA: 'Indonésie',
  IND: 'Inde',
  IRI: 'Iran',
  ISR: 'Israël',
  ITA: 'Italie',
  JOR: 'Jordanie',
  JPN: 'Japon',
  KAZ: 'Kazakhstan',
  KEN: 'Kenya',
  KGZ: 'Kirghizistan',
  KOR: 'Corée du Sud',
  KSA: 'Arabie saoudite',
  LBN: 'Liban',
  LTU: 'Lituanie',
  LUX: 'Luxembourg',
  MAD: 'Madagascar',
  MAR: 'Maroc',
  MDA: 'Moldavie',
  MEX: 'Mexique',
  MGL: 'Mongolie',
  MLI: 'Mali',
  NED: 'Pays-Bas',
  NGR: 'Nigeria',
  NZL: 'Nouvelle-Zélande',
  POR: 'Portugal',
  ROU: 'Roumanie',
  RSA: 'Afrique du Sud',
  RUS: 'Russie',
  SEN: 'Sénégal',
  SGP: 'Singapour',
  SLO: 'Slovénie',
  SRB: 'Serbie',
  SUI: 'Suisse',
  SVK: 'Slovaquie',
  TPE: 'Taipei chinois',
  TTO: 'Trinité-et-Tobago',
  TUN: 'Tunisie',
  TUR: 'Turquie',
  UAE: 'Émirats arabes unis',
  UKR: 'Ukraine',
  USA: 'États-Unis',
  UZB: 'Ouzbékistan',
  VEN: 'Venezuela',
  VIE: 'Vietnam',
  ZAM: 'Zambie',
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
