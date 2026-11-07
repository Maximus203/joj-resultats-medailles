import { describe, expect, it } from 'vitest';
import { checkCommitCommand, commitMessage } from './commit-message-core.mts';
import { decisionOf, runHook } from './run-hook.mts';

const bash = (command: string) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Bash',
  tool_input: { command, description: 'Commit' },
});

describe('commit-message hook (PreToolUse on Bash)', () => {
  it('allows a Conventional Commits message', () => {
    expect(checkCommitCommand(bash('git commit -m "feat(api): add disciplines"'))).toEqual({
      allow: true,
    });
    expect(checkCommitCommand(bash("git add -A && git commit -m 'fix!: drop old route'"))).toEqual({
      allow: true,
    });
  });

  it('denies a free-form message and explains the expected format', () => {
    const decision = checkCommitCommand(bash('git commit -m "ajout des disciplines"'));
    expect(decision.allow).toBe(false);
    expect(!decision.allow && decision.reason).toMatch(/Conventional Commits/);
    expect(!decision.allow && decision.reason).toMatch(/feat\(api\): add disciplines endpoint/);
  });

  it('denies an unknown type, a missing description or an overlong subject', () => {
    expect(checkCommitCommand(bash('git commit -m "feature: x"')).allow).toBe(false);
    expect(checkCommitCommand(bash('git commit -m "feat:"')).allow).toBe(false);
    expect(checkCommitCommand(bash(`git commit -m "feat: ${'x'.repeat(100)}"`)).allow).toBe(false);
  });

  it('reads the first line of a heredoc message, as Claude Code writes them', () => {
    const command = `git commit -m "$(cat <<'EOF'\nfeat(web): add form\n\nCorps du message.\nEOF\n)"`;
    expect(commitMessage(command)).toBe('feat(web): add form\n\nCorps du message.');
    expect(checkCommitCommand(bash(command))).toEqual({ allow: true });
    expect(checkCommitCommand(bash(command.replace('feat(web): add form', 'WIP'))).allow).toBe(
      false,
    );
  });

  it('ignores other commands and commits without an inline message', () => {
    expect(checkCommitCommand(bash('git status'))).toEqual({ allow: true });
    expect(checkCommitCommand(bash('git commit'))).toEqual({ allow: true });
    expect(checkCommitCommand(bash('git commit --amend --no-edit'))).toEqual({ allow: true });
    expect(checkCommitCommand({ tool_name: 'Write', tool_input: {} })).toEqual({ allow: true });
  });

  it.each([
    'git commit --no-verify -m "feat: x"',
    'git commit -n -m "feat: x"',
    'git commit -anm "feat: x"',
    'LEFTHOOK=0 git commit -m "feat: x"',
    'git -c core.hooksPath=/dev/null commit -m "feat: x"',
  ])('denies a commit that skips the pre-commit checks: %s', (command) => {
    const decision = checkCommitCommand(bash(command));
    expect(decision.allow).toBe(false);
    expect(!decision.allow && decision.reason).toMatch(/pnpm verify/);
  });

  it('ignores a git commit written inside a quoted string', () => {
    expect(
      checkCommitCommand(
        bash(`node -e "edit('SKILL.md', 'puis git commit -m \\"docs(<module>): x\\"')"`),
      ),
    ).toEqual({ allow: true });
    expect(checkCommitCommand(bash(`echo 'git commit --no-verify'`))).toEqual({ allow: true });
  });

  it('does not mistake a flag written inside the message for a real one', () => {
    expect(checkCommitCommand(bash('git commit -m "fix: handle -n and --no-verify"'))).toEqual({
      allow: true,
    });
    expect(checkCommitCommand(bash('git commit -am "feat: x"'))).toEqual({ allow: true });
  });

  it('script: denies a badly named commit from the JSON sent by Claude Code', () => {
    const { status, stdout } = runHook('commit-message.mts', bash('git commit -m "wip"'));
    expect(status).toBe(0);
    expect(decisionOf(stdout)).toMatchObject({ permissionDecision: 'deny' });
  });

  it('script: stays silent for a valid commit', () => {
    const { status, stdout } = runHook(
      'commit-message.mts',
      bash('git commit -m "test: cover AS4"'),
    );
    expect(status).toBe(0);
    expect(decisionOf(stdout)).toBeUndefined();
  });
});
