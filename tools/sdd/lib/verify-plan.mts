/**
 * `pnpm verify` : la vérification unique des fichiers modifiés, lancée par les skills et par
 * lefthook avant chaque commit. Format, lint et types comme le hook de fin de tour, puis les tests
 * liés aux fichiers modifiés. Logique pure : git et pnpm sont dans verify.mts.
 */
import {
  type CheckCommand,
  checkCommands,
  type WorkspacePackage,
} from '../../../.claude/hooks/stop-check-core.mts';

const TOOLS_DIR = 'tools/sdd/';
/** Fichiers que Vitest sait relier à des tests : le code des packages et des hooks. */
const VITEST_SOURCE = /^(?:apps\/|packages\/|\.claude\/hooks\/).*\.[cm]?[jt]sx?$/;

export function verifyCommands(
  files: string[],
  existing: string[],
  packages: WorkspacePackage[],
): CheckCommand[] {
  const commands = checkCommands(files, existing, packages);

  if (files.some((file) => file.startsWith(TOOLS_DIR))) {
    commands.push(
      { label: 'typecheck (tools)', command: 'pnpm', args: ['exec', 'tsc', '-p', TOOLS_DIR] },
      {
        label: 'tests (tools)',
        command: 'node',
        args: ['--test', `${TOOLS_DIR}**/*.test.mts`],
      },
    );
  }

  const sources = existing.filter((file) => VITEST_SOURCE.test(file));
  if (sources.length > 0) {
    commands.push({
      label: 'tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'related', '--run', '--passWithNoTests', ...sources],
    });
  }
  return commands;
}
