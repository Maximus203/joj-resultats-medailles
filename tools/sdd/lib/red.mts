/**
 * `pnpm tdd:red <fichier>` : le test doit échouer pour la bonne raison, c'est-à-dire sur une
 * assertion (ou une erreur levée par le code testé), pas parce que le fichier ne se charge pas ou
 * qu'un module, un export, un nom manque. Logique pure : lit le rapport JSON de Vitest.
 */
import { stripVTControlCharacters } from 'node:util';

/** Champs lus du rapport `vitest run --reporter=json`. */
export interface VitestReport {
  testResults: {
    name: string;
    status: string;
    /** Erreur du fichier entier : import introuvable, erreur de syntaxe… */
    message?: string;
    assertionResults: { title: string; status: string; failureMessages?: string[] }[];
  }[];
}

export interface RedResult {
  red: boolean;
  message: string;
}

const SCENARIO_TITLE = /^\d{3}-AS[1-9]\d*:/;

/** Échecs qui disent que le code manque encore, pas qu'il se comporte mal. */
const SETUP_ERRORS = [
  /Cannot find (?:module|package)/,
  /Failed to (?:load|resolve)/,
  /does not provide an export named/,
  /Transform failed|PARSE_ERROR/,
  /^SyntaxError\b/,
  /^ReferenceError\b/,
  /^TypeError\b.* is not (?:a function|a constructor|iterable)/,
];

const SKELETON_HINT =
  "Crée d'abord un squelette : le module et ses exports, avec leurs types, dont le corps lève " +
  "`new Error('non implémenté')`. Puis relance `pnpm tdd:red`.";

function firstLine(text: string): string {
  return (
    stripVTControlCharacters(text)
      .split('\n')
      .find((line) => line.trim())
      ?.trim() ?? ''
  );
}

export function classifyRed(report: VitestReport): RedResult {
  const brokenFile = report.testResults.find((result) => result.message?.trim());
  if (brokenFile) {
    return {
      red: false,
      message: [
        `Le fichier de test ne se charge pas : ${firstLine(brokenFile.message ?? '')}`,
        SKELETON_HINT,
      ].join('\n'),
    };
  }

  const tests = report.testResults.flatMap((result) => result.assertionResults);
  if (tests.length === 0) {
    return { red: false, message: 'Aucun test trouvé dans ce fichier : écris le test d’abord.' };
  }

  const failures = tests
    .filter((test) => test.status === 'failed')
    .map((test) => ({ title: test.title, reason: firstLine(test.failureMessages?.[0] ?? '') }));
  if (failures.length === 0) {
    return {
      red: false,
      message:
        'Le test passe déjà : il ne prouve rien. Écris un test qui échoue tant que la ' +
        'fonctionnalité manque (ou vérifie que ce n’est pas déjà fait).',
    };
  }

  const setup = failures.find(({ reason }) => SETUP_ERRORS.some((error) => error.test(reason)));
  if (setup) {
    return {
      red: false,
      message: [
        `Rouge, mais pas pour la bonne raison : « ${setup.title} » échoue sur ${setup.reason}`,
        SKELETON_HINT,
      ].join('\n'),
    };
  }

  const titled = failures.filter(({ title }) => SCENARIO_TITLE.test(title));
  if (titled.length === 0) {
    return {
      red: false,
      message:
        'Aucun test en échec ne commence par l’identifiant de son scénario : écris son titre ' +
        '`001-AS2: …` (numéro de la spec et scénario de la tâche).',
    };
  }

  return {
    red: true,
    message: [
      'Rouge pour la bonne raison. Écris maintenant le code minimal qui le fait passer.',
      ...titled.map(({ title, reason }) => `  ✗ ${title} — ${reason}`),
    ].join('\n'),
  };
}
