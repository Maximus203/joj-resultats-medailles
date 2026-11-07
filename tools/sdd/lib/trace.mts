/**
 * Traçabilité : chaque scénario de la spec a au moins un test dont le titre commence par son
 * identifiant (`it('001-AS2: …')`), et aucun test ne cite un scénario absent. Logique pure.
 */

export interface Citation {
  /** `AS2` */
  scenario: string;
  file: string;
  line: number;
}

export interface Trace {
  matrix: { scenario: string; files: string[] }[];
  problems: string[];
}

const TEST_FILE = /\.(?:spec|test)\.[cm]?[jt]sx?$/;

export function isTestFile(path: string): boolean {
  return TEST_FILE.test(path);
}

/** Les titres de test qui commencent par `<number>-ASn:`, entre ', " ou `. */
export function citations(file: string, text: string, number: string): Citation[] {
  const title = new RegExp(`['"\`]${number}-(AS[1-9]\\d*):`, 'g');
  return text.split('\n').flatMap((raw, index) =>
    [...raw.matchAll(title)].map((match) => ({
      scenario: match[1] ?? '',
      file,
      line: index + 1,
    })),
  );
}

export function trace(number: string, scenarioIds: string[], found: Citation[]): Trace {
  const matrix = scenarioIds.map((id) => ({
    scenario: `${number}-${id}`,
    files: [...new Set(found.filter((c) => c.scenario === id).map((c) => c.file))].sort(),
  }));
  const problems = [
    ...matrix
      .filter((row) => row.files.length === 0)
      .map((row) => `${row.scenario} n'a aucun test (titre « ${row.scenario}: … »)`),
    ...found
      .filter((c) => !scenarioIds.includes(c.scenario))
      .map((c) => `${c.file}:${c.line} cite ${number}-${c.scenario}, absent de la spec`),
  ];
  return { matrix, problems };
}
