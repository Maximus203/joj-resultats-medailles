/**
 * `pnpm playbook:check [NNN]` : chaque playbook de `playbooks/NNN-nom.md` couvre tous les
 * scénarios de `specs/NNN-*`, avec les champs, profils et verdicts attendus.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkPlaybook, profiles } from './playbook-format.mts';
import type { RunResult } from './spec-check-run.mts';
import { type Problem, scenarios } from './spec-format.mts';

const PLAYBOOK_FILE = /^(\d{3})-[a-z0-9-]+\.md$/;

function format(problem: Problem): string {
  return `  ✗ ${problem.file}:${problem.line} ${problem.message}`;
}

export function runPlaybookCheck(root: string, args: string[]): RunResult {
  const arg = args.find((value) => !value.startsWith('--'));
  const target = arg ? /(\d{3})/.exec(arg)?.[1] : undefined;
  const dir = join(root, 'playbooks');
  if (!existsSync(dir)) return { ok: true, output: 'aucun dossier playbooks/ : rien à vérifier' };

  const profilesFile = join(dir, 'profils.md');
  if (!existsSync(profilesFile)) {
    return {
      ok: false,
      output: '  ✗ playbooks/profils.md absent : chaque scénario y cite un profil.',
    };
  }
  const known = profiles(readFileSync(profilesFile, 'utf8'));

  const files = readdirSync(dir)
    .filter((name) => PLAYBOOK_FILE.test(name))
    .filter((name) => !target || name.startsWith(`${target}-`))
    .sort();
  if (files.length === 0) {
    return { ok: !target, output: target ? `aucun playbook pour « ${target} »` : 'aucun playbook' };
  }

  const out: string[] = [];
  let ok = true;
  for (const name of files) {
    const number = PLAYBOOK_FILE.exec(name)?.[1] ?? '';
    const file = `playbooks/${name}`;
    const specsDir = join(root, 'specs');
    const specDir = existsSync(specsDir)
      ? readdirSync(specsDir, { withFileTypes: true }).find(
          (entry) => entry.isDirectory() && entry.name.startsWith(`${number}-`),
        )
      : undefined;
    if (!specDir) {
      out.push(format({ file, line: 1, message: `aucune spec specs/${number}-*` }));
      ok = false;
      continue;
    }
    const specText = readFileSync(join(specsDir, specDir.name, 'spec.md'), 'utf8');
    const ids = scenarios(specText).map((scenario) => scenario.id);
    const problems = checkPlaybook(file, readFileSync(join(dir, name), 'utf8'), number, known, ids);
    if (problems.length === 0) {
      out.push(`  ✓ ${file} (${ids.length} scénario(s) de spec couverts)`);
    } else {
      ok = false;
      out.push(...problems.map(format));
    }
  }
  return { ok, output: out.join('\n') };
}
