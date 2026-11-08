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

  it('007-AS4: reads every hyphen and dash, with or without spaces around, as one hyphen', () => {
    const official = normalizeEventKey("Swimming – Women's 50m Freestyle");

    for (const dash of ['-', '‐', '‑', '‒', '–', '—', '−', '﹘', '﹣', '－']) {
      expect(normalizeEventKey(`Swimming${dash}Women's 50m Freestyle`)).toBe(official);
      expect(normalizeEventKey(`Swimming ${dash} Women's 50m Freestyle`)).toBe(official);
    }
    expect(normalizeEventKey('Judo – Men -66 kg')).toBe(normalizeEventKey('Judo - Men -66 kg'));
    expect(normalizeEventKey('Judo – Men -66 kg')).not.toBe(normalizeEventKey('Judo – Men -60 kg'));
  });
});
