/**
 * Hook PreToolUse sur Edit|Write : refuse d'écrire un secret probable (clé d'API, token, mot de
 * passe en clair, clé privée). Logique pure ; la lecture de l'entrée est dans secret-guard.mts.
 */
import type { Decision, PreToolUseInput } from './hook-io.mts';

interface SecretPattern {
  label: string;
  pattern: RegExp;
  /** Groupe qui contient la valeur, pour écarter les valeurs factices. 0 = tout le motif. */
  valueGroup?: number;
}

const PATTERNS: SecretPattern[] = [
  { label: 'clé privée', pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
  { label: 'clé AWS', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'clé d’API Anthropic', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { label: 'clé d’API OpenAI', pattern: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}/ },
  {
    label: 'token GitHub',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/,
  },
  { label: 'token Slack', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { label: 'clé d’API Google', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: 'clé Stripe', pattern: /\b[rs]k_live_[0-9a-zA-Z]{20,}/ },
  {
    label: 'token JWT',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  },
  {
    label: 'mot de passe dans une URL',
    pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:([^\s@/]{8,})@/i,
    valueGroup: 1,
  },
  {
    // password: "…", apiKey = '…', "client_secret": "…"
    label: 'secret en clair',
    pattern:
      /\b\w*(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key)\w*["']?\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/i,
    valueGroup: 1,
  },
  {
    // Fichier .env : API_TOKEN=valeur
    label: 'secret en clair',
    pattern:
      /^\s*(?:export\s+)?[A-Z0-9_]*(?:PASSWORD|SECRET|TOKEN|API_KEY|APIKEY|ACCESS_KEY)[A-Z0-9_]*\s*=\s*([^\s#"'`]{8,})/m,
    valueGroup: 1,
  },
];

/** Valeurs d'exemple qu'on peut écrire sans risque. */
const PLACEHOLDER =
  /^(?:changeme|change-me|example|placeholder|dummy|redacted|secret|password|motdepasse|x{3,}|\*{3,}|\.{3,}|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]+|your[-_].*|ton[-_].*|votre[-_].*|.*[-_]here)$/i;

export function findSecret(text: string): { label: string; line: number } | undefined {
  for (const { label, pattern, valueGroup = 0 } of PATTERNS) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    for (const match of text.matchAll(new RegExp(pattern.source, flags))) {
      const value = match[valueGroup] ?? '';
      if (PLACEHOLDER.test(value)) continue;
      const line = text.slice(0, match.index).split('\n').length;
      return { label, line };
    }
  }
  return undefined;
}

export function checkSecretWrite(input: PreToolUseInput): Decision {
  const { tool_name: tool, tool_input: toolInput } = input;
  if ((tool !== 'Write' && tool !== 'Edit') || !toolInput) return { allow: true };

  const text = tool === 'Write' ? toolInput.content : toolInput.new_string;
  const secret = text ? findSecret(text) : undefined;
  if (!secret) return { allow: true };

  return {
    allow: false,
    reason: [
      `Écriture refusée : ${secret.label} probable, ligne ${secret.line} du texte à écrire dans ${toolInput.file_path ?? 'le fichier'}.`,
      'Un secret écrit dans un fichier finit dans git, puis chez tous ceux qui clonent le dépôt.',
      'Mets la vraie valeur dans apps/api/.env (ignoré par git) et lis-la par la configuration (AppConfig) ;',
      'dans un exemple ou un test, écris une valeur factice (`changeme`, `<ta-clé>`).',
      'Si c’est un faux positif, dis-le à l’utilisateur au lieu de contourner la vérification.',
    ].join('\n'),
  };
}
