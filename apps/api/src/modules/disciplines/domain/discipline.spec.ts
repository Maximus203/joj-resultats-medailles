import { describe, expect, it } from 'vitest';
import { Discipline } from './discipline';
import { DisciplineError } from './disciplines.errors';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000001';

describe('Discipline', () => {
  it('000-AS1: creates a discipline with a trimmed name and a listed category', () => {
    const discipline = Discipline.create({
      id: ID,
      name: '  Lutte  ',
      category: 'sports-de-combat',
      now: NOW,
    });
    expect(discipline).toMatchObject({
      id: ID,
      name: 'Lutte',
      category: 'sports-de-combat',
      createdAt: NOW,
    });
  });

  it.each(['', '   '])('000-AS2: rejects a discipline without a name (%j)', (name) => {
    expect(() => Discipline.create({ id: ID, name, category: 'athletisme', now: NOW })).toThrow(
      expect.objectContaining({ code: 'DISCIPLINE_NAME_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it('000-AS2: rejects a name that is too long', () => {
    expect(() =>
      Discipline.create({ id: ID, name: 'x'.repeat(101), category: 'athletisme', now: NOW }),
    ).toThrow(expect.objectContaining({ code: 'DISCIPLINE_NAME_TOO_LONG' }));
  });

  it('000-AS3: rejects a category outside the list', () => {
    expect(() => Discipline.create({ id: ID, name: 'Échecs', category: 'jeux', now: NOW })).toThrow(
      DisciplineError,
    );
    expect(() => Discipline.create({ id: ID, name: 'Échecs', category: 'jeux', now: NOW })).toThrow(
      expect.objectContaining({ code: 'DISCIPLINE_CATEGORY_UNKNOWN', kind: 'VALIDATION' }),
    );
  });

  const lutte = () =>
    Discipline.create({ id: ID, name: 'Lutte', category: 'sports-de-combat', now: NOW });

  it('000-AS7: renames a discipline with a trimmed name and changes its category', () => {
    const discipline = lutte();
    discipline.rename('  Lutte sénégalaise ');
    discipline.changeCategory('athletisme');
    expect(discipline).toMatchObject({
      id: ID,
      name: 'Lutte sénégalaise',
      category: 'athletisme',
      createdAt: NOW,
    });
  });

  it('000-AS8: applies the creation rules to an update', () => {
    const discipline = lutte();
    expect(() => discipline.rename('  ')).toThrow(
      expect.objectContaining({ code: 'DISCIPLINE_NAME_REQUIRED' }),
    );
    expect(() => discipline.rename('x'.repeat(101))).toThrow(
      expect.objectContaining({ code: 'DISCIPLINE_NAME_TOO_LONG' }),
    );
    expect(() => discipline.changeCategory('jeux')).toThrow(
      expect.objectContaining({ code: 'DISCIPLINE_CATEGORY_UNKNOWN' }),
    );
    expect(discipline).toMatchObject({ name: 'Lutte', category: 'sports-de-combat' });
  });
});
