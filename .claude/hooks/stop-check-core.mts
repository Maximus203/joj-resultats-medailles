/**
 * Commandes de vérification (format, lint, types) des seuls fichiers changés, utilisées par
 * `pnpm verify` (tools/sdd). Logique pure ; git et pnpm sont dans tools/sdd/verify.mts.
 */

export interface CheckCommand {
  label: string;
  command: string;
  args: string[];
}

export interface CheckFailure {
  label: string;
  output: string;
}

/** Un package du workspace : son dossier (`apps/api`) et son nom (`@joj/api`). */
export interface WorkspacePackage {
  dir: string;
  name: string;
}

const OUTPUT_TAIL_LINES = 40;
const LINTABLE = /\.(?:[cm]?[jt]sx?)$/;
const HOOKS_DIR = '.claude/hooks/';

/**
 * `existing` : les fichiers de `files` encore présents. Une suppression ne se formate ni ne se
 * lint, mais elle peut casser les types de son package (un import vers un fichier supprimé).
 */
export function checkCommands(
  files: string[],
  existing: string[],
  packages: WorkspacePackage[],
): CheckCommand[] {
  const commands: CheckCommand[] = [];
  // Sans chemin, oxfmt et oxlint vérifieraient tout le dépôt.
  if (existing.length > 0) {
    commands.push({
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', '--check', '--no-error-on-unmatched-pattern', ...existing],
    });
  }
  const lintable = existing.filter((file) => LINTABLE.test(file));
  if (lintable.length > 0) {
    commands.push({ label: 'lint', command: 'pnpm', args: ['exec', 'oxlint', ...lintable] });
  }

  // `...@joj/shared` : le package et ceux qui en dépendent (un changement de shared peut casser
  // les types de l'API et du front).
  const touched = packages.filter(({ dir }) => files.some((file) => file.startsWith(`${dir}/`)));
  if (touched.length > 0) {
    commands.push({
      label: 'typecheck',
      command: 'pnpm',
      args: [...touched.flatMap(({ name }) => ['--filter', `...${name}`]), 'run', 'typecheck'],
    });
  }
  if (files.some((file) => file.startsWith(HOOKS_DIR))) {
    commands.push({
      label: 'typecheck (hooks)',
      command: 'pnpm',
      args: ['exec', 'tsc', '-p', HOOKS_DIR],
    });
  }
  return commands;
}

export function failureReport(failures: CheckFailure[]): string {
  const sections = failures.map(({ label, output }) => {
    const tail = output.trimEnd().split('\n').slice(-OUTPUT_TAIL_LINES).join('\n');
    return `### ${label}\n\n${tail}`;
  });
  return [
    `Vérification de fin de tour en échec (${failures.map((f) => f.label).join(' ; ')}).`,
    "Corrige avant de rendre la main : `pnpm format` règle le format ; pour le lint et les types, lis l'erreur ci-dessous.",
    "Si l'échec vient de fichiers qui ne sont pas les tiens, dis-le à l'utilisateur au lieu de les modifier.",
    ...sections,
  ].join('\n\n');
}
