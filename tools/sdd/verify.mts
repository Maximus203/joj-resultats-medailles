/**
 * `pnpm verify` : vérifie les fichiers modifiés depuis le dernier commit (index, arbre de travail,
 * fichiers nouveaux et supprimés), ou seulement l'index avec --staged (lefthook, avant chaque
 * commit). Voir lib/verify-plan.mts.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { WorkspacePackage } from '../../.claude/hooks/stop-check-core.mts';
import { PROJECT_DIR } from './lib/project.mts';
import { run } from './lib/run.mts';
import { verifyCommands } from './lib/verify-plan.mts';

const OUTPUT_TAIL_LINES = 40;

/** Avec --staged (lefthook) : seulement ce qui part dans le commit. */
function changedFiles(staged: boolean): string[] {
  if (staged) return lines(run('git', ['diff', '--cached', '--name-only']).output);
  const diff = run('git', ['diff', 'HEAD', '--name-only']);
  const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
  return lines(`${diff.output}\n${untracked.output}`);
}

function lines(output: string): string[] {
  return [...new Set(output.split('\n'))]
    .map((file) => file.trim())
    .filter(Boolean)
    .sort();
}

function workspacePackages(): WorkspacePackage[] {
  return ['apps', 'packages'].flatMap((root) =>
    existsSync(join(PROJECT_DIR, root))
      ? readdirSync(join(PROJECT_DIR, root))
          .map((name) => `${root}/${name}`)
          .filter((dir) => existsSync(join(PROJECT_DIR, dir, 'package.json')))
          .map((dir) => ({
            dir,
            name: (
              JSON.parse(readFileSync(join(PROJECT_DIR, dir, 'package.json'), 'utf8')) as {
                name: string;
              }
            ).name,
          }))
      : [],
  );
}

const files = changedFiles(process.argv.includes('--staged'));
const existing = files.filter((file) => existsSync(join(PROJECT_DIR, file)));
const commands = verifyCommands(files, existing, workspacePackages());
if (commands.length === 0) {
  console.log('verify : aucun fichier modifié.');
  process.exit(0);
}

const failures: string[] = [];
for (const { label, command, args } of commands) {
  const started = Date.now();
  const { status, output } = run(command, args);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`${status === 0 ? '✓' : '✗'} ${label} (${seconds} s)`);
  if (status !== 0) {
    failures.push(label);
    console.log(output.trimEnd().split('\n').slice(-OUTPUT_TAIL_LINES).join('\n'));
  }
}
if (failures.length > 0) {
  console.log(
    `\nverify en échec (${failures.join(' ; ')}). ` +
      '`pnpm format` règle le format ; pour le reste, lis l’erreur ci-dessus.',
  );
  process.exit(1);
}
console.log(`verify : ${files.length} fichier(s) modifié(s), tout est vert.`);
