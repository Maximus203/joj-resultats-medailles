import type { Problem } from './spec-format.mts';

export const SURFACES = ['WEB', 'API', 'BE'] as const;
export const PRIORITIES = ['critique', 'normal', 'secondaire'] as const;
export const TECHNIQUES = [
  'nominal',
  'erreur',
  'valeurs-limites',
  'partition-équivalence',
  'table-décision',
  'transition-état',
] as const;
export const VERDICTS = ['⬜', '✅', '🟡', '❌', '⏭️'] as const;

const PLACEHOLDER = '_(à remplir)_';
const HEADING = /^### (\d{3})-(AS\d+)\.(\d+) — \[([A-Z]+)\] (.+)$/;
const FIELD = /^\*\*([^*]+)\*\* : (.*)$/;
const REQUIRED = ['Profil', 'Priorité', 'Technique', 'Action', 'Attendu', 'Observé', 'Verdict'];

export interface PlaybookScenario {
  /** `001-AS2.1` */
  id: string;
  /** `001-AS2`, le scénario de la spec */
  specId: string;
  number: string;
  surface: string;
  line: number;
  fields: Map<string, string>;
}

/** Les identifiants (`## journaliste`) déclarés dans playbooks/profils.md. */
export function profiles(text: string): string[] {
  return text.split(/\r?\n/).flatMap((raw) => {
    const match = /^## ([a-zà-ÿ]+)\s*$/.exec(raw);
    return match?.[1] && match[1] !== 'ajouter' ? [match[1]] : [];
  });
}

export function playbookScenarios(text: string): PlaybookScenario[] {
  const found: PlaybookScenario[] = [];
  let current: PlaybookScenario | undefined;
  text.split(/\r?\n/).forEach((raw, index) => {
    const heading = HEADING.exec(raw);
    if (heading?.[1] && heading[2] && heading[3] && heading[4]) {
      current = {
        id: `${heading[1]}-${heading[2]}.${heading[3]}`,
        specId: `${heading[1]}-${heading[2]}`,
        number: heading[1],
        surface: heading[4],
        line: index + 1,
        fields: new Map(),
      };
      found.push(current);
      return;
    }
    if (raw.startsWith('#')) {
      current = undefined;
      return;
    }
    const field = FIELD.exec(raw);
    if (current && field?.[1] && field[2] !== undefined) {
      const name = field[1].trim().replace(/ \[BE\]$/, '');
      if (!current.fields.has(name)) current.fields.set(name, field[2].trim());
    }
  });
  return found;
}

export function checkPlaybook(
  file: string,
  text: string,
  number: string,
  knownProfiles: string[],
  specScenarios: string[],
): Problem[] {
  const problems: Problem[] = [];
  const add = (line: number, message: string) => problems.push({ file, line, message });
  const items = playbookScenarios(text);

  if (!/^> .*Statut : (⬜|✅|🟡|❌)/m.test(text)) {
    add(1, "l'en-tête doit porter « Statut : ⬜|✅|🟡|❌ »");
  }

  for (const item of items) {
    if (item.number !== number) add(item.line, `${item.id} : le préfixe doit être ${number}`);
    if (!(SURFACES as readonly string[]).includes(item.surface)) {
      add(item.line, `${item.id} : surface [${item.surface}] inconnue (${SURFACES.join(', ')})`);
    }
    if (!specScenarios.includes(item.specId.slice(4))) {
      add(item.line, `${item.id} : ${item.specId} n'existe pas dans la spec`);
    }
    for (const name of REQUIRED) {
      if (!item.fields.get(name)) add(item.line, `${item.id} : champ « ${name} » manquant`);
    }
    const profile = item.fields.get('Profil');
    if (profile && !knownProfiles.includes(profile)) {
      add(item.line, `${item.id} : profil « ${profile} » absent de playbooks/profils.md`);
    }
    const priority = item.fields.get('Priorité');
    if (priority && !(PRIORITIES as readonly string[]).includes(priority)) {
      add(item.line, `${item.id} : priorité « ${priority} » inconnue`);
    }
    const technique = item.fields.get('Technique');
    if (technique && !(TECHNIQUES as readonly string[]).includes(technique)) {
      add(item.line, `${item.id} : technique « ${technique} » inconnue`);
    }
    const verdict = item.fields.get('Verdict');
    if (verdict && !(VERDICTS as readonly string[]).includes(verdict)) {
      add(item.line, `${item.id} : verdict « ${verdict} » inconnu`);
    }
    if (verdict && verdict !== '⬜' && item.fields.get('Observé') === PLACEHOLDER) {
      add(item.line, `${item.id} : un verdict ${verdict} exige un « Observé » renseigné`);
    }
  }

  for (const id of specScenarios) {
    if (!items.some((item) => item.specId === `${number}-${id}`)) {
      add(1, `le scénario ${number}-${id} de la spec n'a aucun scénario de playbook`);
    }
  }
  return problems;
}
