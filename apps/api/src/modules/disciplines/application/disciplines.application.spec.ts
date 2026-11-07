import { describe, expect, it } from 'vitest';
import { InMemoryDisciplineRepository } from './testing/in-memory-discipline.repository';
import { CreateDiscipline } from './use-cases/create-discipline';
import { DeleteDiscipline } from './use-cases/delete-discipline';
import { GetDiscipline } from './use-cases/get-discipline';
import { ListDisciplines } from './use-cases/list-disciplines';
import { UpdateDiscipline } from './use-cases/update-discipline';

function setup() {
  const disciplines = new InMemoryDisciplineRepository();
  return {
    createDiscipline: new CreateDiscipline(disciplines),
    listDisciplines: new ListDisciplines(disciplines),
    getDiscipline: new GetDiscipline(disciplines),
    updateDiscipline: new UpdateDiscipline(disciplines),
    deleteDiscipline: new DeleteDiscipline(disciplines),
  };
}

describe('disciplines (application layer)', () => {
  it('000-AS1: creates a discipline and finds it in the list', async () => {
    const { createDiscipline, listDisciplines } = setup();
    const created = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await listDisciplines.execute()).toEqual([created]);
  });

  it('000-AS2: rejects a discipline without a name', async () => {
    const { createDiscipline, listDisciplines } = setup();
    await expect(
      createDiscipline.execute({ name: ' ', category: 'athletisme' }),
    ).rejects.toMatchObject({ code: 'DISCIPLINE_NAME_REQUIRED' });
    expect(await listDisciplines.execute()).toEqual([]);
  });

  it('000-AS4: rejects a name already taken', async () => {
    const { createDiscipline } = setup();
    await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });
    await expect(
      createDiscipline.execute({ name: 'Lutte', category: 'athletisme' }),
    ).rejects.toMatchObject({ code: 'DISCIPLINE_NAME_TAKEN', kind: 'CONFLICT' });
  });

  it('000-AS5: lists disciplines sorted by name', async () => {
    const { createDiscipline, listDisciplines } = setup();
    for (const name of ['Natation', 'Basketball 3x3', 'Lutte']) {
      await createDiscipline.execute({ name, category: 'athletisme' });
    }
    const names = (await listDisciplines.execute()).map((discipline) => discipline.name);
    expect(names).toEqual(['Basketball 3x3', 'Lutte', 'Natation']);
  });

  it('000-AS6: gets a discipline by its id', async () => {
    const { createDiscipline, getDiscipline } = setup();
    const created = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });
    expect(await getDiscipline.execute(created.id)).toEqual(created);
  });

  it('000-AS7: persists a new name and a new category', async () => {
    const { createDiscipline, updateDiscipline, getDiscipline } = setup();
    const { id } = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });

    const updated = await updateDiscipline.execute(id, {
      name: 'Lutte sénégalaise',
      category: 'athletisme',
    });

    expect(updated).toMatchObject({ id, name: 'Lutte sénégalaise', category: 'athletisme' });
    expect(await getDiscipline.execute(id)).toEqual(updated);
  });

  it('000-AS8: rejects an invalid update and keeps the discipline unchanged', async () => {
    const { createDiscipline, updateDiscipline, getDiscipline } = setup();
    const { id } = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });

    await expect(updateDiscipline.execute(id, { name: ' ' })).rejects.toMatchObject({
      code: 'DISCIPLINE_NAME_REQUIRED',
    });
    expect(await getDiscipline.execute(id)).toMatchObject({ name: 'Lutte' });
  });

  it('000-AS9: rejects a name taken by another discipline, but keeps its own name', async () => {
    const { createDiscipline, updateDiscipline } = setup();
    await createDiscipline.execute({ name: 'Natation', category: 'sports-nautiques' });
    const { id } = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });

    await expect(updateDiscipline.execute(id, { name: 'Natation' })).rejects.toMatchObject({
      code: 'DISCIPLINE_NAME_TAKEN',
      kind: 'CONFLICT',
    });
    await expect(
      updateDiscipline.execute(id, { name: 'Lutte', category: 'athletisme' }),
    ).resolves.toMatchObject({ name: 'Lutte', category: 'athletisme' });
  });

  it('000-AS10: deletes a discipline', async () => {
    const { createDiscipline, deleteDiscipline, listDisciplines } = setup();
    const { id } = await createDiscipline.execute({ name: 'Lutte', category: 'sports-de-combat' });

    await deleteDiscipline.execute(id);

    expect(await listDisciplines.execute()).toEqual([]);
  });

  it('000-AS11: reports an unknown discipline as not found', async () => {
    const { getDiscipline, updateDiscipline, deleteDiscipline } = setup();
    const unknown = '0199f5c2-0000-7000-8000-00000000ffff';
    const notFound = { code: 'DISCIPLINE_NOT_FOUND', kind: 'NOT_FOUND' };

    await expect(getDiscipline.execute(unknown)).rejects.toMatchObject(notFound);
    await expect(updateDiscipline.execute(unknown, { name: 'Lutte' })).rejects.toMatchObject(
      notFound,
    );
    await expect(deleteDiscipline.execute(unknown)).rejects.toMatchObject(notFound);
  });
});
