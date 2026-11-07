/** Hook PreToolUse (Edit|Write) : voir secret-guard-core.mts. */
import { type PreToolUseInput, printDecision, readHookInput } from './hook-io.mts';
import { checkSecretWrite } from './secret-guard-core.mts';

printDecision(checkSecretWrite(readHookInput<PreToolUseInput>()));
