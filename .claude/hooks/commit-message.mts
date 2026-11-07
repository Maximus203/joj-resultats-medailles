/** Hook PreToolUse (Bash) : voir commit-message-core.mts. */
import { checkCommitCommand } from './commit-message-core.mts';
import { type PreToolUseInput, printDecision, readHookInput } from './hook-io.mts';

printDecision(checkCommitCommand(readHookInput<PreToolUseInput>()));
