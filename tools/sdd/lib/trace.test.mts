import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { citations, isTestFile, trace } from './trace.mts';

const TEST_FILE = [
  "describe('inscriptions', () => {",
  "  it('001-AS1: registers a volunteer', () => {});",
  '  it("001-AS2: rejects a full slot", () => {});',
  '  test(`001-AS2: answers 409`, () => {});',
  "  it('002-AS1: belongs to another spec', () => {});",
  "  it('AS3: old style title, ignored', () => {});",
  '});',
].join('\n');

describe('isTestFile', () => {
  it('recognizes unit, integration, e2e and screen tests', () => {
    for (const file of [
      'apps/api/src/a/domain/x.spec.ts',
      'apps/api/src/a/infra/x.int.spec.ts',
      'apps/api/test/x.e2e.spec.ts',
      'apps/web/src/features/x/y.test.tsx',
      'apps/web/src/mocks/handlers.test.ts',
    ]) {
      assert.equal(isTestFile(file), true, file);
    }
    assert.equal(isTestFile('apps/api/src/a/domain/x.ts'), false);
  });
});

describe('citations', () => {
  it('finds the test titles that start with a scenario of the spec', () => {
    assert.deepEqual(citations('x.spec.ts', TEST_FILE, '001'), [
      { scenario: 'AS1', file: 'x.spec.ts', line: 2 },
      { scenario: 'AS2', file: 'x.spec.ts', line: 3 },
      { scenario: 'AS2', file: 'x.spec.ts', line: 4 },
    ]);
  });
});

describe('trace', () => {
  it('maps each scenario to the files that test it', () => {
    const found = citations('x.spec.ts', TEST_FILE, '001');
    assert.deepEqual(trace('001', ['AS1', 'AS2'], found), {
      matrix: [
        { scenario: '001-AS1', files: ['x.spec.ts'] },
        { scenario: '001-AS2', files: ['x.spec.ts'] },
      ],
      problems: [],
    });
  });

  it('fails on a scenario without a test', () => {
    const { matrix, problems } = trace(
      '001',
      ['AS1', 'AS3'],
      [{ scenario: 'AS1', file: 'a.spec.ts', line: 1 }],
    );
    assert.deepEqual(matrix[1], { scenario: '001-AS3', files: [] });
    assert.deepEqual(problems, ["001-AS3 n'a aucun test (titre « 001-AS3: … »)"]);
  });

  it('fails on a test that cites a scenario absent from the spec', () => {
    const { problems } = trace(
      '001',
      ['AS1'],
      [
        { scenario: 'AS1', file: 'a.spec.ts', line: 1 },
        { scenario: 'AS7', file: 'b.test.tsx', line: 12 },
      ],
    );
    assert.deepEqual(problems, ['b.test.tsx:12 cite 001-AS7, absent de la spec']);
  });
});
