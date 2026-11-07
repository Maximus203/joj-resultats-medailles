/** `pnpm playbook:check [NNN]` : voir lib/playbook-check-run.mts. */
import { runPlaybookCheck } from './lib/playbook-check-run.mts';
import { PROJECT_DIR } from './lib/project.mts';

const { ok, output } = runPlaybookCheck(PROJECT_DIR, process.argv.slice(2));
console.log(output);
process.exit(ok ? 0 : 1);
