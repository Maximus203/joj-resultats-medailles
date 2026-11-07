/**
 * `pnpm spec:check [specs/NNN-nom | NNN | specs/prd-nom.md] [--trace]` : lit les PRD et les specs
 * sur le disque et rend un rapport. Sans argument, vérifie tous les PRD et toutes les specs ; avec
 * --trace, ajoute la matrice scénario → tests.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  checkPlan,
  checkPrd,
  checkSpec,
  prdLink,
  type Problem,
  scenarios,
  tranches,
} from './spec-format.mts';
import { type Citation, citations, isTestFile, trace } from './trace.mts';

export interface RunResult {
  ok: boolean;
  output: string;
}

const SPEC_DIR = /^(\d{3})-[a-z0-9-]+$/;
const PRD_FILE = /^prd-[a-z0-9-]+\.md$/;
const TEST_ROOTS = ['apps', 'packages'];
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.data']);

/** Chemin relatif au dépôt, avec des / même sous Windows. */
function rel(root: string, path: string): string {
  return relative(root, path).split('\\').join('/');
}

function specDirs(root: string): string[] {
  const specs = join(root, 'specs');
  if (!existsSync(specs)) return [];
  return readdirSync(specs)
    .filter((name) => SPEC_DIR.test(name) && statSync(join(specs, name)).isDirectory())
    .sort()
    .map((name) => `specs/${name}`);
}

function prdFiles(root: string): string[] {
  const specs = join(root, 'specs');
  if (!existsSync(specs)) return [];
  return readdirSync(specs)
    .filter((name) => PRD_FILE.test(name))
    .sort()
    .map((name) => `specs/${name}`);
}

/** Le PRD cité par la spec existe, et la tranche y figure. */
function checkLink(root: string, specFile: string, spec: string): Problem[] {
  const link = prdLink(spec);
  if (!link) return [];
  if (!existsSync(join(root, link.file))) {
    return [{ file: specFile, line: link.line, message: `${link.file} introuvable` }];
  }
  const ids = tranches(readFileSync(join(root, link.file), 'utf8')).map((t) => t.id);
  if (ids.includes(link.tranche)) return [];
  return [
    {
      file: specFile,
      line: link.line,
      message: `la tranche ${link.tranche} n'existe pas dans ${link.file}`,
    },
  ];
}

function testFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (isTestFile(entry.name)) {
        found.push(rel(root, join(dir, entry.name)));
      }
    }
  };
  for (const top of TEST_ROOTS) if (existsSync(join(root, top))) walk(join(root, top));
  return found.sort();
}

function format(problem: Problem): string {
  return `  ✗ ${problem.file}:${problem.line} ${problem.message}`;
}

export function runSpecCheck(root: string, args: string[]): RunResult {
  const withTrace = args.includes('--trace');
  const target = args.find((arg) => !arg.startsWith('--'));
  const out: string[] = [];
  let ok = true;

  if (!existsSync(join(root, 'specs/constitution.md'))) {
    out.push('  ✗ specs/constitution.md absent : chaque skill le lit.');
    ok = false;
  }

  let prds = prdFiles(root);
  let dirs = specDirs(root);
  if (target) {
    const wanted = target.replace(/\\/g, '/').replace(/\/$/, '');
    prds = prds.filter((file) => file === wanted || file === `specs/${wanted}`);
    dirs =
      prds.length > 0
        ? []
        : dirs.filter(
            (dir) =>
              dir === wanted ||
              dir.slice('specs/'.length).startsWith(wanted.replace(/^specs\//, '')),
          );
    if (prds.length === 0 && dirs.length === 0) {
      return {
        ok: false,
        output: `aucune spec ne correspond à « ${target} » (dossiers specs/NNN-nom, ou specs/prd-nom.md)`,
      };
    }
  }

  for (const file of prds) {
    const problems = checkPrd(file, readFileSync(join(root, file), 'utf8'));
    if (problems.length > 0) {
      out.push(`${file} : ${problems.length} problème(s)`, ...problems.map(format));
      ok = false;
    } else {
      out.push(`${file} : PRD conforme`);
    }
  }
  if (prds.length === 0 && dirs.length === 0) {
    out.push('aucune spec dans specs/ : rien à vérifier.');
    return { ok, output: out.join('\n') };
  }

  const tests = withTrace
    ? testFiles(root).map((file) => ({ file, text: readFileSync(join(root, file), 'utf8') }))
    : [];

  for (const dir of dirs) {
    const number = dir.slice('specs/'.length, 'specs/'.length + 3);
    const specFile = `${dir}/spec.md`;
    const planFile = `${dir}/plan.md`;
    if (!existsSync(join(root, specFile))) {
      out.push(format({ file: specFile, line: 1, message: 'fichier absent' }));
      ok = false;
      continue;
    }
    const spec = readFileSync(join(root, specFile), 'utf8');
    const ids = scenarios(spec).map((s) => s.id);
    const problems = [...checkSpec(specFile, spec, number), ...checkLink(root, specFile, spec)];
    const hasPlan = existsSync(join(root, planFile));
    if (hasPlan) {
      problems.push(
        ...checkPlan(planFile, readFileSync(join(root, planFile), 'utf8'), number, ids),
      );
    }
    if (problems.length > 0) {
      out.push(`${dir} : ${problems.length} problème(s)`, ...problems.map(format));
      ok = false;
    } else {
      out.push(`${dir} : ${hasPlan ? 'spec et plan conformes' : 'spec conforme'}`);
    }

    if (withTrace) {
      const found: Citation[] = tests.flatMap(({ file, text }) => citations(file, text, number));
      const result = trace(number, ids, found);
      out.push(`${dir} : traçabilité scénario → tests`);
      for (const row of result.matrix) {
        out.push(
          `  ${row.scenario} → ${row.files.length > 0 ? row.files.join(', ') : '(aucun test)'}`,
        );
      }
      out.push(...result.problems.map((problem) => `  ✗ ${problem}`));
      if (result.problems.length > 0) ok = false;
    }
  }
  return { ok, output: out.join('\n') };
}
