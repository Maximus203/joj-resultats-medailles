/**
 * Entrées et sorties communes des hooks de Claude Code : JSON sur l'entrée standard, décision sur
 * la sortie standard. Voir https://code.claude.com/docs/en/hooks
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Ce que Claude Code envoie à un hook PreToolUse (champs utilisés ici). */
export interface PreToolUseInput {
  tool_name?: string;
  tool_input?: {
    command?: string;
    file_path?: string;
    content?: string;
    new_string?: string;
  };
}

export type Decision = { allow: true } | { allow: false; reason: string };

export function readHookInput<T>(): T {
  try {
    return JSON.parse(readFileSync(0, 'utf8') || '{}') as T;
  } catch {
    return {} as T;
  }
}

/** Refuse l'appel d'outil : Claude Code montre la raison à l'agent, qui corrige et réessaie. */
export function printDecision(decision: Decision): void {
  if (decision.allow) return;
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: decision.reason,
      },
    }),
  );
}

/** Racine du dépôt : les hooks lancent git et pnpm depuis là, quel que soit le dossier courant. */
export const PROJECT_DIR = fileURLToPath(new URL('../..', import.meta.url));
