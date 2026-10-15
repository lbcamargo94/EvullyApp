import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };

describe('measurements', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-10-19T12:00:00.000Z', '2026-10-19'));
    dispose = app.dispose;
    const { id: profileId } = await app.handlers['profiles:create'](person);
    const state = await app.handlers['tracking:accept']({
      profileId,
      answers: {
        project: {
          name: 'Shape de Praia',
          objective: 'fat_loss',
          startDate: '2026-10-05',
          targetDate: '2026-12-06',
        },
        focusAreas: ['waist', 'hips'],
        weightDisplay: 'trend',
        interests: { menstrualCycle: null, progressPhotos: null, pin: null, weighingDevice: null },
        suggestion: null,
      },
    });
    const typeId = (code: string) => must(state.measurementTypes.find((t) => t.code === code)).id;
    const register = (date: string, values: Record<string, number>) =>
      app.handlers['measurements:register']({
        profileId,
        measuredOn: date,
        measuredAt: `${date}T07:00:00.000Z`,
        values: Object.entries(values).map(([code, valueCm]) => ({
          measurementTypeId: typeId(code),
          valueCm,
        })),
        notes: null,
      });
    return { ...app, profileId, typeId, register };
  };

  it('registers a session and lists it with names', async () => {
    const { handlers, profileId, register } = await setup();
    const session = await register('2026-10-05', { waist: 96.04, hips: 109 });
    expect(session.values.map((v) => [v.code, v.name, v.valueCm])).toEqual([
      ['waist', 'Cintura', 96],
      ['hips', 'Quadril', 109],
    ]);
    expect(await handlers['measurements:list']({ profileId })).toEqual([session]);
  });

  it('summarizes each tracked measurement since the project start', async () => {
    const { handlers, profileId, register } = await setup();
    await register('2026-10-05', { waist: 96, abdomen: 96, hips: 109 });
    await register('2026-10-12', { waist: 94.6 });
    await register('2026-10-19', { waist: 93.4, hips: 109.5 });

    const { objective, items } = await handlers['measurements:summary']({ profileId });
    expect(objective).toBe('fat_loss');
    expect(items.map((i) => [i.code, i.current?.valueCm, i.start?.valueCm, i.change])).toEqual([
      ['waist', 93.4, 96, -2.6],
      ['abdomen', 96, 96, 0],
      ['hips', 109.5, 109, 0.5],
    ]);
    expect(must(items[0]).series).toHaveLength(3);
  });

  it('updates a session and replaces its values', async () => {
    const { handlers, profileId, typeId, register } = await setup();
    const session = await register('2026-10-12', { waist: 94.6, hips: 108 });
    const updated = await handlers['measurements:update']({
      id: session.id,
      profileId,
      measuredOn: '2026-10-12',
      measuredAt: '2026-10-12T08:00:00.000Z',
      values: [{ measurementTypeId: typeId('waist'), valueCm: 94.2 }],
      notes: 'Fita nova',
    });
    expect(updated.values.map((v) => [v.code, v.valueCm])).toEqual([['waist', 94.2]]);
    expect(updated.notes).toBe('Fita nova');
  });

  it('rejects measurements the profile does not track and writes nothing', async () => {
    const { db, handlers, profileId } = await setup();
    const state = await handlers['tracking:get-state']({ profileId });
    const catalog = await db.selectFrom('measurement_types').select(['id', 'code']).execute();
    const neck = must(catalog.find((t) => t.code === 'neck'));
    const waist = must(state.measurementTypes.find((t) => t.code === 'waist'));
    await expect(
      handlers['measurements:register']({
        profileId,
        measuredOn: '2026-10-19',
        measuredAt: '2026-10-19T07:00:00.000Z',
        values: [
          { measurementTypeId: waist.id, valueCm: 93 },
          { measurementTypeId: neck.id, valueCm: 40 },
        ],
        notes: null,
      }),
    ).rejects.toThrow(ValidationError);
    expect(await db.selectFrom('body_measurements').select('id').execute()).toHaveLength(0);
  });

  it('applies the domain rules', async () => {
    const { register } = await setup();
    await expect(register('2026-10-20', { waist: 93 })).rejects.toThrow(ValidationError);
    await expect(register('2026-10-19', { waist: 301 })).rejects.toThrow(ValidationError);
  });

  it('soft-deletes and keeps profiles isolated', async () => {
    const { db, handlers, profileId, register } = await setup();
    const session = await register('2026-10-19', { waist: 93 });
    const other = await handlers['profiles:create']({ ...person, name: 'Ana' });
    await handlers['tracking:skip']({ profileId: other.id });

    expect(await handlers['measurements:list']({ profileId: other.id })).toEqual([]);
    await expect(
      handlers['measurements:delete']({ profileId: other.id, id: session.id }),
    ).rejects.toThrow(NotFoundError);

    expect(await handlers['measurements:delete']({ profileId, id: session.id })).toBeNull();
    expect(await handlers['measurements:list']({ profileId })).toEqual([]);
    const row = await db.selectFrom('body_measurements').select('deleted_at').executeTakeFirst();
    expect(row?.deleted_at).toBe('2026-10-19T12:00:00.000Z');
  });
});
