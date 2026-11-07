import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { runPlaybookCheck } from './playbook-check-run.mts';

function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'playbook-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

const SPEC = '# 001 — Podium\n\n### AS1 — Enregistrer\n\n### AS2 — Refuser\n';
const PROFILES = '# Profils\n\n## journaliste\n\n## supporter\n';

function scenario(id: string, extra: Record<string, string> = {}): string {
  const fields: Record<string, string> = {
    Profil: 'journaliste',
    Priorité: 'critique',
    Technique: 'nominal',
    Action: 'faire',
    Attendu: 'voir',
    Observé: '_(à remplir)_',
    Verdict: '⬜',
    ...extra,
  };
  const lines = Object.entries(fields).map(([name, value]) => `**${name}** : ${value}`);
  return `### ${id} — [API] Titre\n${lines.join('\n')}\n`;
}

const HEADER = '# 001\n\n> Spec : specs/001-x · Statut : ⬜\n\n';
const base = (playbook: string) => ({
  'specs/001-x/spec.md': SPEC,
  'playbooks/profils.md': PROFILES,
  'playbooks/001-x.md': playbook,
});

describe('runPlaybookCheck', () => {
  it('passes when every spec scenario has a playbook scenario', () => {
    const result = runPlaybookCheck(
      repo(base(HEADER + scenario('001-AS1.1') + scenario('001-AS2.1'))),
      [],
    );
    assert.equal(result.ok, true, result.output);
  });

  it('reports a spec scenario without playbook scenario', () => {
    const result = runPlaybookCheck(repo(base(HEADER + scenario('001-AS1.1'))), []);
    assert.equal(result.ok, false);
    assert.match(result.output, /001-AS2 de la spec n'a aucun scénario/);
  });

  it('reports a scenario that the spec does not have', () => {
    const body = HEADER + scenario('001-AS1.1') + scenario('001-AS2.1') + scenario('001-AS9.1');
    const result = runPlaybookCheck(repo(base(body)), []);
    assert.match(result.output, /001-AS9 n'existe pas dans la spec/);
  });

  it('reports an unknown profile and a missing field', () => {
    const body =
      HEADER + scenario('001-AS1.1', { Profil: 'fantôme', Attendu: '' }) + scenario('001-AS2.1');
    const result = runPlaybookCheck(repo(base(body)), []);
    assert.match(result.output, /profil « fantôme » absent/);
    assert.match(result.output, /champ « Attendu » manquant/);
  });

  it('requires an observation once a verdict is given', () => {
    const body = HEADER + scenario('001-AS1.1', { Verdict: '✅' }) + scenario('001-AS2.1');
    const result = runPlaybookCheck(repo(base(body)), []);
    assert.match(result.output, /exige un « Observé » renseigné/);
  });

  it('fails when the profiles file is missing', () => {
    const result = runPlaybookCheck(repo({ 'playbooks/001-x.md': HEADER }), []);
    assert.equal(result.ok, false);
    assert.match(result.output, /profils\.md absent/);
  });

  it('fails on a playbook without matching spec', () => {
    const files = { 'playbooks/profils.md': PROFILES, 'playbooks/002-y.md': HEADER };
    const result = runPlaybookCheck(repo(files), []);
    assert.equal(result.ok, false);
    assert.match(result.output, /aucune spec specs\/002-/);
  });
});
