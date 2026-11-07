/**
 * `pnpm tdd:red <fichier de test>` : lance ce test seul et vérifie qu'il échoue pour la bonne
 * raison (voir lib/red.mts). Code 0 seulement si le rouge est valide.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PROJECT_DIR } from './lib/project.mts';
import { classifyRed, type VitestReport } from './lib/red.mts';
import { run } from './lib/run.mts';

const file = process.argv[2];
if (!file) {
  console.error('Usage : pnpm tdd:red <fichier de test>, par exemple apps/api/src/…/x.spec.ts');
  process.exit(1);
}
if (!existsSync(resolve(PROJECT_DIR, file))) {
  console.error(`Fichier introuvable : ${file}. Écris le test d'abord.`);
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'tdd-red-'));
const reportFile = join(dir, 'report.json');
const { output } = run('pnpm', [
  'exec',
  'vitest',
  'run',
  file,
  '--reporter=json',
  `--outputFile=${reportFile}`,
]);
if (!existsSync(reportFile)) {
  console.error(
    `Vitest n'a pas produit de rapport :\n${output.trimEnd().split('\n').slice(-30).join('\n')}`,
  );
  process.exit(1);
}
const report = JSON.parse(readFileSync(reportFile, 'utf8')) as VitestReport;
rmSync(dir, { recursive: true, force: true });

const { red, message } = classifyRed(report);
console.log(`tdd:red ${file}\n${message}`);
process.exit(red ? 0 : 1);
