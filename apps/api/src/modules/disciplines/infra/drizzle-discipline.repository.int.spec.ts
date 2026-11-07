import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { Discipline } from '../domain/discipline';
import { DrizzleDisciplineRepository } from './drizzle-discipline.repository';

const newDiscipline = (name: string, now = new Date()) =>
  Discipline.create({ id: randomUUID(), name, category: 'athletisme', now });

describe('DrizzleDisciplineRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleDisciplineRepository;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    repository = new DrizzleDisciplineRepository(connection.db);
  });

  afterAll(() => connection?.close());

  it('000-AS1: reads back exactly what it wrote', async () => {
    const discipline = newDiscipline('Aviron', new Date('2026-10-31T09:00:00.123Z'));
    await repository.insert(discipline);

    expect(await repository.findByName('Aviron')).toEqual(discipline);
    expect(await repository.findByName('Inconnue')).toBeNull();
  });

  it('000-AS4: turns the name unique constraint into a domain error', async () => {
    await repository.insert(newDiscipline('Escrime'));
    await expect(repository.insert(newDiscipline('Escrime'))).rejects.toMatchObject({
      code: 'DISCIPLINE_NAME_TAKEN',
    });
  });

  it('000-AS5: lists sorted by name', async () => {
    await repository.insert(newDiscipline('Zumba'));
    await repository.insert(newDiscipline('Badminton'));
    const names = (await repository.list()).map((discipline) => discipline.name);
    expect(names).toEqual([...names].sort());
    expect(names).toEqual(expect.arrayContaining(['Badminton', 'Zumba']));
  });

  it('000-AS6: finds a discipline by its id', async () => {
    const discipline = newDiscipline('Judo');
    await repository.insert(discipline);

    expect(await repository.findById(discipline.id)).toEqual(discipline);
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('000-AS7: writes a new name and a new category', async () => {
    const discipline = newDiscipline('Voile');
    await repository.insert(discipline);

    discipline.rename('Voile légère');
    discipline.changeCategory('sports-nautiques');
    await repository.update(discipline);

    expect(await repository.findById(discipline.id)).toMatchObject({
      name: 'Voile légère',
      category: 'sports-nautiques',
    });
  });

  it('000-AS9: turns the name unique constraint into a domain error on update', async () => {
    await repository.insert(newDiscipline('Karaté'));
    const other = newDiscipline('Taekwondo');
    await repository.insert(other);

    other.rename('Karaté');
    await expect(repository.update(other)).rejects.toMatchObject({
      code: 'DISCIPLINE_NAME_TAKEN',
    });
  });

  it('000-AS10: deletes a discipline and says whether it existed', async () => {
    const discipline = newDiscipline('Cyclisme');
    await repository.insert(discipline);

    expect(await repository.delete(discipline.id)).toBe(true);
    expect(await repository.findById(discipline.id)).toBeNull();
    expect(await repository.delete(discipline.id)).toBe(false);
  });
});
