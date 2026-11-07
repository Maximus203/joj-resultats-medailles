/** Pour les tests : lance un hook comme Claude Code, avec son entrée JSON sur stdin. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function runHook(script: string, input: unknown, env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** La décision PreToolUse écrite par le hook, ou undefined s'il laisse passer. */
export function decisionOf(
  stdout: string,
): { permissionDecision: string; reason: string } | undefined {
  if (!stdout.trim()) return undefined;
  const output = JSON.parse(stdout) as {
    hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string };
  };
  return {
    permissionDecision: output.hookSpecificOutput.permissionDecision,
    reason: output.hookSpecificOutput.permissionDecisionReason,
  };
}
