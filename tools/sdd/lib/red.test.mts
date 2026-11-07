import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyRed, type VitestReport } from './red.mts';

// Rapports `vitest run --reporter=json`, réduits aux champs lus, tels que Vitest 5 les écrit.
const file = (
  assertionResults: VitestReport['testResults'][number]['assertionResults'],
  message = '',
) => ({
  testResults: [
    { name: '/repo/apps/api/src/x.spec.ts', status: 'failed', message, assertionResults },
  ],
});
const failed = (title: string, failure: string) => ({
  title,
  status: 'failed',
  failureMessages: [`${failure}\n    at /repo/apps/api/src/x.spec.ts:3:20`],
});
const passed = (title: string) => ({ title, status: 'passed', failureMessages: [] });

describe('classifyRed', () => {
  it('accepts a test that fails on an assertion', () => {
    const result = classifyRed(
      file([
        failed('001-AS2: rejects a full slot', 'AssertionError: expected 201 to be 409'),
        passed('001-AS1: registers a volunteer'),
      ]),
    );
    assert.equal(result.red, true);
    assert.match(result.message, /rouge pour la bonne raison/i);
    assert.match(result.message, /001-AS2: rejects a full slot/);
    assert.match(result.message, /expected 201 to be 409/);
  });

  it('accepts a business error thrown by a skeleton', () => {
    const result = classifyRed(file([failed('001-AS2: x', 'Error: non implémenté')]));
    assert.equal(result.red, true);
  });

  it('refuses a test file that does not load: missing module, syntax error', () => {
    const missing = classifyRed(
      file([], "Cannot find module './inscription' imported from /repo/apps/api/src/x.spec.ts"),
    );
    assert.equal(missing.red, false);
    assert.match(missing.message, /ne se charge pas/);
    assert.match(missing.message, /Cannot find module '.\/inscription'/);
    assert.match(missing.message, /squelette/);

    const syntax = classifyRed(
      file(
        [],
        'Transform failed with 1 error:\n\n\u001b[31m[PARSE_ERROR] \u001b[0mUnexpected token',
      ),
    );
    assert.equal(syntax.red, false);
    assert.match(syntax.message, /Transform failed/);
    assert.ok(!syntax.message.includes('\u001b'), 'sans codes couleur');
  });

  it('refuses a failure caused by a missing export or an undefined name', () => {
    for (const failure of [
      'TypeError: (0 , __vite_ssr_import_1__.register) is not a function',
      'TypeError: Inscription is not a constructor',
      'ReferenceError: register is not defined',
      'SyntaxError: The requested module does not provide an export named register',
    ]) {
      const result = classifyRed(file([failed('001-AS1: x', failure)]));
      assert.equal(result.red, false, failure);
      assert.match(result.message, /pas pour la bonne raison/);
    }
  });

  it('refuses a test that already passes', () => {
    const result = classifyRed(file([passed('001-AS1: x')]));
    assert.equal(result.red, false);
    assert.match(result.message, /passe déjà/);
  });

  it('refuses a file without any test', () => {
    assert.match(classifyRed({ testResults: [] }).message, /aucun test/i);
    assert.match(classifyRed(file([])).message, /aucun test/i);
  });

  it('requires the failing test to start with its scenario id', () => {
    const result = classifyRed(
      file([failed('rejects a full slot', 'AssertionError: expected 1 to be 2')]),
    );
    assert.equal(result.red, false);
    assert.match(result.message, /001-AS2: …/);
  });
});
