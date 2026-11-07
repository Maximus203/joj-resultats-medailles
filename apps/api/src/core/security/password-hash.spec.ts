import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password-hash';

describe('password hash', () => {
  it('003-AS1: verifies the password it hashed and refuses another', () => {
    const hash = hashPassword('Superpass');
    expect(verifyPassword('Superpass', hash)).toBe(true);
    expect(verifyPassword('superpass', hash)).toBe(false);
  });

  it('003-AS2: never stores the password and salts each hash', () => {
    const first = hashPassword('Superpass');
    expect(first).not.toContain('Superpass');
    expect(hashPassword('Superpass')).not.toBe(first);
  });

  it('003-AS3: refuses a malformed hash instead of throwing', () => {
    expect(verifyPassword('Superpass', 'not-a-hash')).toBe(false);
    expect(verifyPassword('Superpass', '')).toBe(false);
  });
});
