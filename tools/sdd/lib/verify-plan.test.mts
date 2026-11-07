import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verifyCommands } from './verify-plan.mts';

const PACKAGES = [
  { dir: 'apps/api', name: '@joj/api' },
  { dir: 'apps/web', name: '@joj/web' },
  { dir: 'packages/shared', name: '@joj/shared' },
];
const labels = (files: string[], existing = files) =>
  verifyCommands(files, existing, PACKAGES).map((c) => c.label);

describe('verifyCommands', () => {
  it('does nothing when nothing changed', () => {
    assert.deepEqual(verifyCommands([], [], PACKAGES), []);
  });

  it('only checks the format of documentation', () => {
    assert.deepEqual(labels(['specs/001-benevoles/spec.md', 'README.md']), ['format']);
  });

  it('checks format, lint, types and related tests of a source file', () => {
    const files = ['apps/api/src/modules/benevoles/domain/inscription.ts'];
    const commands = verifyCommands(files, files, PACKAGES);
    assert.deepEqual(
      commands.map((c) => c.label),
      ['format', 'lint', 'typecheck', 'tests'],
    );
    assert.deepEqual(commands.at(-1), {
      label: 'tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'related', '--run', '--passWithNoTests', ...files],
    });
  });

  it('type-checks a deleted file but neither formats nor tests it', () => {
    assert.deepEqual(labels(['packages/shared/src/gone.ts'], []), ['typecheck']);
  });

  it('checks the tools with their own types and node --test', () => {
    const commands = verifyCommands(['tools/sdd/lib/red.mts'], ['tools/sdd/lib/red.mts'], PACKAGES);
    assert.deepEqual(
      commands.map((c) => c.label),
      ['format', 'lint', 'typecheck (tools)', 'tests (tools)'],
    );
  });

  it('runs the related tests of the hooks', () => {
    assert.ok(labels(['.claude/hooks/commit-message-core.mts']).includes('tests'));
  });
});
