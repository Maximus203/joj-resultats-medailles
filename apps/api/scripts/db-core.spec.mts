import { describe, expect, it } from 'vitest';
import { seedStatements, tableNameFromFile } from './db-core.mts';

describe('tableNameFromFile', () => {
  it('uses the file name without its ordering prefix', () => {
    expect(tableNameFromFile('disciplines.json')).toBe('disciplines');
    expect(tableNameFromFile('02-athletes.json')).toBe('athletes');
  });
});

describe('seedStatements', () => {
  it('builds one parameterized, idempotent INSERT per row', () => {
    expect(
      seedStatements('disciplines', [{ name: 'Lutte', category: 'sports-de-combat' }]),
    ).toEqual([
      {
        table: 'disciplines',
        sql: 'INSERT INTO "disciplines" ("name", "category") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        params: ['Lutte', 'sports-de-combat'],
      },
    ]);
  });

  it('rejects a file that is not an array of objects', () => {
    expect(() => seedStatements('t', { name: 'x' })).toThrow(/tableau/);
    expect(() => seedStatements('t', ['x'])).toThrow(/ligne 0/);
  });
});
