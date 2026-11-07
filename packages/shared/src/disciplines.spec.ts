import { describe, expect, it } from 'vitest';
import { createDisciplineSchema, updateDisciplineSchema } from './disciplines.ts';

describe('createDisciplineSchema', () => {
  it('000-AS1: accepts a name and a listed category, and trims the name', () => {
    expect(
      createDisciplineSchema.parse({ name: '  Lutte ', category: 'sports-de-combat' }),
    ).toEqual({ name: 'Lutte', category: 'sports-de-combat' });
  });

  it.each(['', '   '])('000-AS2: rejects a discipline without a name (%j)', (name) => {
    expect(createDisciplineSchema.safeParse({ name, category: 'athletisme' }).success).toBe(false);
  });

  it('000-AS3: rejects a category outside the list', () => {
    expect(createDisciplineSchema.safeParse({ name: 'Échecs', category: 'jeux' }).success).toBe(
      false,
    );
  });
});

describe('updateDisciplineSchema', () => {
  it('000-AS7: accepts a new name, a new category, or both', () => {
    expect(updateDisciplineSchema.parse({ name: ' Lutte ' })).toEqual({ name: 'Lutte' });
    expect(updateDisciplineSchema.parse({ category: 'athletisme' })).toEqual({
      category: 'athletisme',
    });
  });

  it.each([{ name: ' ' }, { category: 'jeux' }, {}])(
    '000-AS8: rejects an empty name, an unlisted category or an empty update (%j)',
    (body) => {
      expect(updateDisciplineSchema.safeParse(body).success).toBe(false);
    },
  );
});
