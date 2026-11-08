import { describe, expect, it } from 'vitest';
import { normalizeEventKey } from './event-key.ts';

describe('normalizeEventKey', () => {
  it('007-AS4: reads every apostrophe, curly or not, as the straight one', () => {
    const official = normalizeEventKey("Swimming – Women's 50m Freestyle");

    for (const apostrophe of ['’', '‘', 'ʼ', '`', '´']) {
      expect(normalizeEventKey(`Swimming - Women${apostrophe}s 50m Freestyle`)).toBe(official);
    }
  });

  it('007-AS4: still tells two different events apart', () => {
    expect(normalizeEventKey("Men's 50m")).not.toBe(normalizeEventKey('Mens 50m'));
  });
});
