/** `pnpm spec:check [specs/NNN-nom | NNN] [--trace]` : voir lib/spec-check-run.mts. */
import { PROJECT_DIR } from './lib/project.mts';
import { runSpecCheck } from './lib/spec-check-run.mts';

const { ok, output } = runSpecCheck(PROJECT_DIR, process.argv.slice(2));
console.log(output);
process.exit(ok ? 0 : 1);
