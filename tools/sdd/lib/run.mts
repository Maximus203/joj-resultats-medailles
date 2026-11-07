import { spawnSync } from 'node:child_process';
import { PROJECT_DIR } from './project.mts';

export interface RunOutput {
  status: number;
  output: string;
}

/** Lance une commande depuis la racine du dépôt et rend son code et sa sortie. */
export function run(command: string, args: string[], { echo = false } = {}): RunOutput {
  const result = spawnSync(command, args, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: echo ? 'inherit' : 'pipe',
    // Sous Windows, pnpm est un script (pnpm.cmd) : il faut un shell pour le lancer.
    shell: process.platform === 'win32',
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`,
  };
}
