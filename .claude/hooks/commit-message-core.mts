/**
 * Hook PreToolUse sur Bash : un `git commit` dont le message ne suit pas Conventional Commits est
 * refusé, avec l'explication ; un commit qui saute la vérification de pré-commit (--no-verify,
 * -n, LEFTHOOK=0) aussi. Logique pure ; la lecture de l'entrée est dans commit-message.mts.
 */
import type { Decision, PreToolUseInput } from './hook-io.mts';

export const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
] as const;

const SUBJECT = new RegExp(`^(${COMMIT_TYPES.join('|')})(\\([a-z0-9._/-]+\\))?!?: \\S`);
const MAX_SUBJECT_LENGTH = 100;

export function checkCommitCommand(input: PreToolUseInput): Decision {
  const command = input.tool_input?.command;
  if (input.tool_name !== 'Bash' || !command || !isGitCommit(command)) return { allow: true };

  const bypass = skippedChecks(command);
  if (bypass) return { allow: false, reason: explainBypass(bypass) };

  const message = commitMessage(command);
  // Message écrit dans l'éditeur, lu dans un fichier (-F) ou repris (--amend --no-edit) :
  // rien à vérifier ici.
  if (message === undefined) return { allow: true };

  const subject = message.split('\n', 1)[0]?.trim() ?? '';
  const problem = subjectProblem(subject);
  return problem ? { allow: false, reason: explain(subject, problem) } : { allow: true };
}

/** Un vrai `git commit`, pas le texte d'une chaîne (`node -e "… git commit …"`, `echo '…'`). */
function isGitCommit(command: string): boolean {
  return /(^|[\s;&|(])git(\s+-[cC]\s+\S+)*\s+commit\b/.test(withoutQuotedText(command));
}

/** La commande sans les heredocs ni le contenu des chaînes entre guillemets. */
function withoutQuotedText(command: string): string {
  return command
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, '')
    .replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');
}

/**
 * Une façon de sauter la vérification de pré-commit (lefthook → pnpm verify), ou undefined. Les
 * textes entre guillemets (le message) sont ignorés : « fix: handle -n » n'est pas un flag.
 */
export function skippedChecks(command: string): string | undefined {
  const code = withoutQuotedText(command);
  if (/\bLEFTHOOK(?:_EXCLUDE)?=/.test(code)) return 'la variable LEFTHOOK';
  if (/core\.hooksPath/.test(code)) return 'core.hooksPath';
  // Les options du seul `git commit`, jusqu'à la commande suivante.
  const options = /\bcommit\b([^;&|]*)/.exec(code)?.[1] ?? '';
  if (/(?:^|\s)--no-verify\b/.test(options)) return '--no-verify';
  if (/(?:^|\s)-[a-zA-Z]*n[a-zA-Z]*\b/.test(options)) return '-n';
  return undefined;
}

function explainBypass(how: string): string {
  return [
    `Commit refusé : ${how} saute la vérification de pré-commit (pnpm verify).`,
    'Cette vérification est la même que celle des skills : si elle échoue, corrige la cause.',
    "Lance `pnpm verify` pour voir l'erreur, corrige, puis relance le commit sans contournement.",
    "Si tu ne sais pas corriger, explique le blocage à l'utilisateur.",
  ].join('\n');
}

/** Premier message passé en ligne : heredoc, -m "…", -m '…', --message=…, -m mot. */
export function commitMessage(command: string): string | undefined {
  const heredoc = /<<-?\s*(['"]?)(\w+)\1[^\n]*\n([\s\S]*?)\n\s*\2\b/.exec(command);
  if (heredoc && /(-m|--message)(\s+|=)["']?\$\(cat\s*<</.test(command)) return heredoc[3];

  const quoted = /(?:\s-m|\s--message)(?:\s+|=)(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/.exec(command);
  if (quoted) return (quoted[1] ?? quoted[2] ?? '').replace(/\\(["\\$`])/g, '$1');

  const bare = /(?:\s-m|\s--message)(?:\s+|=)([^\s"'-][^\s]*)/.exec(command);
  return bare?.[1];
}

function subjectProblem(subject: string): string | undefined {
  if (!subject) return 'le message est vide';
  if (!SUBJECT.test(subject))
    return 'la première ligne ne commence pas par « type(portée): description »';
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return `la première ligne fait ${subject.length} caractères (${MAX_SUBJECT_LENGTH} au plus)`;
  }
  return undefined;
}

function explain(subject: string, problem: string): string {
  return [
    `Commit refusé : ${problem}.`,
    `Message reçu : « ${subject} »`,
    'Ce dépôt suit Conventional Commits (https://www.conventionalcommits.org/fr/) : ' +
      '`type(portée optionnelle): description`, en minuscules, une ligne de 100 caractères au plus.',
    `Types acceptés : ${COMMIT_TYPES.join(', ')}.`,
    'Exemples : `feat(api): add disciplines endpoint`, `fix(web): show conflict error`, `test: cover AS4`.',
    'Réécris le message et relance la commande.',
  ].join('\n');
}
