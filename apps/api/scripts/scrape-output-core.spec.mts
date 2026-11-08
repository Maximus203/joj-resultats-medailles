import { describe, expect, it } from 'vitest';
import { planWrite } from './scrape-output-core.mts';

describe('planWrite', () => {
  it('007-AS7: tells in French how many podiums are replaced and written', () => {
    expect(planWrite(57, 63, false)).toEqual({
      write: true,
      message: '57 podium(s) remplacé(s) par 63 podium(s) écrit(s).',
    });
    expect(planWrite(0, 5, false).write).toBe(true);
  });

  it('007-AS7: refuses to shrink the file without --force, and says how to force', () => {
    const refused = planWrite(598, 12, false);

    expect(refused.write).toBe(false);
    expect(refused.message).toBe(
      'Refusé : le nouveau fichier ne contient que 12 podium(s) contre 598 aujourd’hui. Relance avec --force pour le remplacer quand même.',
    );
    expect(planWrite(598, 12, true)).toEqual({
      write: true,
      message: '598 podium(s) remplacé(s) par 12 podium(s) écrit(s).',
    });
  });
});
