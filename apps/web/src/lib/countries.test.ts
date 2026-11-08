// Prouve que chaque pays vu à l'import des résultats officiels (essai réel du 2026-11-08, 68 pays)
// a un nom français : un code sans nom s'affiche brut, sans qu'on sache de quel pays il s'agit.
import { describe, expect, it } from 'vitest';
import { countryLabel, countryName } from './countries';

const IMPORTED_CODES =
  `ARG AUS AUT AZE BDI BEL BLR BRA BUL CAN CHN COD COL CRO CUB CYP CZE ECU EGY ESP EST FRA GEO
GER GRE HKG HUN INA IND IRI ISR ITA JOR JPN KAZ KEN KGZ KOR KSA LBN LTU LUX MAD MDA MEX MGL NED NZL POR ROU RSA
RUS SEN SGP SLO SRB SUI SVK TPE TTO TUR UAE UKR USA UZB VEN VIE ZAM`.split(/\s+/);

describe('country names', () => {
  it('007-AS8: names every country seen on the official site', () => {
    expect(IMPORTED_CODES).toHaveLength(68);
    expect(IMPORTED_CODES.filter((code) => countryName(code) === undefined)).toEqual([]);
  });

  it('007-AS8: names the six countries the QA found without a name', () => {
    expect(countryLabel('AZE')).toBe('AZE · Azerbaïdjan');
    expect(countryLabel('COD')).toBe('COD · RD Congo');
    expect(countryLabel('HKG')).toBe('HKG · Hong Kong');
    expect(countryLabel('IRI')).toBe('IRI · Iran');
    expect(countryLabel('UKR')).toBe('UKR · Ukraine');
    expect(countryLabel('VIE')).toBe('VIE · Vietnam');
  });
});
