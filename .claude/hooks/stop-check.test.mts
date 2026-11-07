import { describe, expect, it } from 'vitest';
import { runHook } from './run-hook.mts';
import { checkCommands, failureReport, planStopCheck } from './stop-check-core.mts';

const PACKAGES = [
  { dir: 'apps/api', name: '@joj/api' },
  { dir: 'apps/web', name: '@joj/web' },
  { dir: 'packages/shared', name: '@joj/shared' },
];

describe('stop-check hook (Stop)', () => {
  it('does nothing when STOP_CHECK=off or when nothing changed', () => {
    expect(
      planStopCheck({ stopHookActive: false, disabled: true, changedFiles: ['a.ts'] }),
    ).toEqual({ run: false, reason: 'STOP_CHECK=off' });
    expect(
      planStopCheck({ stopHookActive: false, disabled: false, changedFiles: [] }),
    ).toMatchObject({ run: false });
  });

  it('blocks on the first failure, only warns when the agent is already continuing because of the hook', () => {
    const input = { disabled: false, changedFiles: ['b.ts', 'a.ts', 'a.ts'] };
    expect(planStopCheck({ ...input, stopHookActive: false })).toEqual({
      run: true,
      files: ['a.ts', 'b.ts'],
      block: true,
    });
    expect(planStopCheck({ ...input, stopHookActive: true })).toMatchObject({ block: false });
  });

  it('checks format, lint and types of the changed files and packages only', () => {
    const files = ['apps/api/src/a.ts', 'README.md', 'packages/shared/src/gone.ts'];
    const existing = ['apps/api/src/a.ts', 'README.md'];
    expect(checkCommands(files, existing, PACKAGES)).toEqual([
      {
        label: 'format',
        command: 'pnpm',
        args: ['exec', 'oxfmt', '--check', '--no-error-on-unmatched-pattern', ...existing],
      },
      { label: 'lint', command: 'pnpm', args: ['exec', 'oxlint', 'apps/api/src/a.ts'] },
      {
        label: 'typecheck',
        command: 'pnpm',
        // Le fichier supprimé de shared compte : il peut casser les packages qui l'importent.
        args: ['--filter', '...@joj/api', '--filter', '...@joj/shared', 'run', 'typecheck'],
      },
    ]);
  });

  it('type-checks the hooks when they change', () => {
    expect(
      checkCommands(['.claude/hooks/x.mts'], ['.claude/hooks/x.mts'], PACKAGES),
    ).toContainEqual({
      label: 'typecheck (hooks)',
      command: 'pnpm',
      args: ['exec', 'tsc', '-p', '.claude/hooks/'],
    });
  });

  it('summarizes each failure with the tail of its output', () => {
    const output = Array.from({ length: 60 }, (_, i) => `ligne ${i}`).join('\n');
    const report = failureReport([{ label: 'lint', output }]);
    expect(report).toMatch(/en échec \(lint\)/);
    expect(report).toContain('ligne 59');
    expect(report).not.toContain('ligne 10\n');
  });

  it('script: STOP_CHECK=off disables the hook, whatever the input', () => {
    const { status, stdout, stderr } = runHook(
      'stop-check.mts',
      { hook_event_name: 'Stop', stop_hook_active: false },
      { STOP_CHECK: 'off' },
    );
    expect({ status, stdout, stderr }).toEqual({ status: 0, stdout: '', stderr: '' });
  });
});
