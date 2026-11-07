/**
 * Hook `Stop` de Claude Code (.claude/settings.json) : à chaque fin de tour, format, lint et types
 * des fichiers changés depuis la branche principale (commits, index, arbre de travail,
 * suppressions comprises). En échec, l'agent reprend la main avec l'erreur (code 2) ; une
 * seconde fois de suite, l'utilisateur est seulement averti.
 *   STOP_CHECK=off  → désactivé
 * Les tests ne sont pas lancés ici : trop lents pour chaque tour.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { PROJECT_DIR, readHookInput } from './hook-io.mts';
import {
  type CheckFailure,
  checkCommands,
  failureReport,
  planStopCheck,
  type WorkspacePackage,
} from './stop-check-core.mts';

process.chdir(PROJECT_DIR);

function git(args: string[]): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Une ref absente (pas de remote origin) n'est pas une erreur à montrer.
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function baseRef(): string {
  for (const ref of ['origin/main', 'main']) {
    try {
      return git(['merge-base', ref, 'HEAD']).trim();
    } catch {
      // ref absente : essayer la suivante
    }
  }
  return 'HEAD';
}

function changedFiles(): string[] {
  try {
    return [
      ...git(['diff', '--name-only', baseRef()]).split('\n'),
      ...git(['ls-files', '--others', '--exclude-standard']).split('\n'),
    ].filter(Boolean);
  } catch {
    // Pas un dépôt git, ou aucun commit : rien à comparer.
    return [];
  }
}

function workspacePackages(): WorkspacePackage[] {
  return ['apps', 'packages'].flatMap((root) =>
    existsSync(root)
      ? readdirSync(root)
          .map((name) => `${root}/${name}`)
          .filter((dir) => existsSync(`${dir}/package.json`))
          .map((dir) => ({
            dir,
            name: (JSON.parse(readFileSync(`${dir}/package.json`, 'utf8')) as { name: string })
              .name,
          }))
      : [],
  );
}

const plan = planStopCheck({
  stopHookActive: readHookInput<{ stop_hook_active?: boolean }>().stop_hook_active === true,
  disabled: process.env['STOP_CHECK'] === 'off',
  changedFiles: changedFiles(),
});
if (!plan.run) process.exit(0);

const failures: CheckFailure[] = [];
const existing = plan.files.filter((path) => existsSync(path));
for (const { label, command, args } of checkCommands(plan.files, existing, workspacePackages())) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // Sous Windows, pnpm est un script (pnpm.cmd) : il faut un shell pour le lancer.
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    failures.push({
      label,
      output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
    });
  }
}
if (failures.length === 0) process.exit(0);

const report = failureReport(failures);
if (plan.block) {
  console.error(report);
  process.exit(2);
}
console.log(JSON.stringify({ systemMessage: report }));
