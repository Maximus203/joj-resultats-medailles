import { describe, expect, it } from 'vitest';
import { seedStatements, tableNameFromFile } from './db-core.mts';

describe('tableNameFromFile', () => {
  it('uses the file name without its ordering prefix', () => {
    expect(tableNameFromFile('pays.json')).toBe('pays');
    expect(tableNameFromFile('02-athletes.json')).toBe('athletes');
  });
});

describe('seedStatements', () => {
  it('builds one parameterized, idempotent INSERT per row', () => {
    expect(seedStatements('pays', [{ code: 'SEN', name: 'Sénégal' }])).toEqual([
      {
        table: 'pays',
        sql: 'INSERT INTO "pays" ("code", "name") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        params: ['SEN', 'Sénégal'],
      },
    ]);
  });

  it('rejects a file that is not an array of objects', () => {
    expect(() => seedStatements('t', { name: 'x' })).toThrow(/tableau/);
    expect(() => seedStatements('t', ['x'])).toThrow(/ligne 0/);
  });
});
