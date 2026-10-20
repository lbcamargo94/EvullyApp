import { ConflictError, NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, must } from './helpers';

const person = { name: 'Lucas', birthDate: null, sex: null, heightCm: null };
const project = {
  name: 'Shape de Praia',
  objective: 'fat_loss',
  startDate: '2026-10-05',
  targetDate: '2026-12-06',
} as const;

describe('settings: tracking, projects and tags', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async (withProject = true) => {
    const app = await createTestApp(fixedClock('2026-10-17T12:00:00.000Z', '2026-10-17'));
    dispose = app.dispose;
    const { id: profileId } = await app.handlers['profiles:create'](person);
    await app.handlers['tracking:accept']({
      profileId,
      answers: {
        project: withProject ? project : null,
        focusAreas: ['waist'],
        weightDisplay: 'trend',
        interests: { menstrualCycle: null, progressPhotos: null, pin: null, weighingDevice: null },
        suggestion: null,
      },
    });
    return { ...app, profileId };
  };

  it('changes the weight display with a new manual config, keeping history', async () => {
    const { db, handlers, profileId } = await setup();
    const state = await handlers['tracking:set-weight-display']({
      profileId,
      weightDisplay: 'hidden',
    });
    expect(state.config).toMatchObject({
      weightDisplay: 'hidden',
      source: 'manual',
      ruleVersion: null,
      focusAreas: ['waist'],
    });
    expect(await db.selectFrom('tracking_configs').select('id').execute()).toHaveLength(2);
  });

  it('sets tracked measurements in order and keeps the history of turned-off ones', async () => {
    const { handlers, profileId } = await setup();
    const catalog = await handlers['tracking:catalog'](undefined);
    const id = (code: string) => must(catalog.find((t) => t.code === code)).id;
    await handlers['measurements:register']({
      profileId,
      measuredOn: '2026-10-17',
      measuredAt: '2026-10-17T07:00:00.000Z',
      values: [{ measurementTypeId: id('abdomen'), valueCm: 95 }],
      notes: null,
    });

    let state = await handlers['tracking:set-measurements']({
      profileId,
      measurementTypeIds: [id('hips'), id('waist')],
    });
    expect(state.measurementTypes.map((t) => t.code)).toEqual(['hips', 'waist']);

    state = await handlers['tracking:set-measurements']({
      profileId,
      measurementTypeIds: [id('waist'), id('hips'), id('abdomen')],
    });
    expect(state.measurementTypes.map((t) => t.code)).toEqual(['waist', 'hips', 'abdomen']);
    const sessions = await handlers['measurements:list']({ profileId });
    expect(sessions[0]?.values[0]?.valueCm).toBe(95); // history survived
  });

  it('rejects unknown measurement types', async () => {
    const { handlers, profileId } = await setup();
    await expect(
      handlers['tracking:set-measurements']({
        profileId,
        measurementTypeIds: ['01900000-0000-7000-8000-999999999999'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('edits, completes and creates projects with one active at a time', async () => {
    const { handlers, profileId } = await setup();
    const active = must(await handlers['projects:get-active']({ profileId }));
    const edited = await handlers['projects:update']({
      profileId,
      id: active.id,
      ...project,
      name: 'Verão',
      objective: 'recomposition',
    });
    expect(edited).toMatchObject({ name: 'Verão', objective: 'recomposition', status: 'active' });

    await expect(handlers['projects:create']({ profileId, ...project })).rejects.toThrow(
      ConflictError,
    );
    await handlers['projects:complete']({ profileId, id: active.id });
    expect(await handlers['projects:get-active']({ profileId })).toBeNull();

    const next = await handlers['projects:create']({
      profileId,
      ...project,
      name: 'Inverno',
      startDate: '2026-12-07',
      targetDate: '2027-03-01',
    });
    expect(next.status).toBe('active');
    const list = await handlers['projects:list']({ profileId });
    expect(list.map((p) => [p.name, p.status])).toEqual([
      ['Inverno', 'active'],
      ['Verão', 'completed'],
    ]);
    await expect(handlers['projects:complete']({ profileId, id: active.id })).rejects.toThrow(
      ConflictError,
    );
  });

  it('applies project rules on edit', async () => {
    const { handlers, profileId } = await setup();
    const active = must(await handlers['projects:get-active']({ profileId }));
    await expect(
      handlers['projects:update']({
        profileId,
        id: active.id,
        ...project,
        targetDate: '2026-10-01',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('renames and removes tags; removed tags disappear but weighings stay', async () => {
    const { handlers, profileId } = await setup();
    const [retention, salty] = await handlers['tags:list']({ profileId });
    const weighing = await handlers['weights:register']({
      profileId,
      measuredOn: '2026-10-17',
      measuredAt: '2026-10-17T07:00:00.000Z',
      weightKg: 90,
      tagIds: [must(retention).id],
      notes: null,
    });

    expect(
      await handlers['tags:rename']({ profileId, id: must(retention).id, name: 'Inchaço' }),
    ).toEqual({ id: must(retention).id, name: 'Inchaço' });
    await expect(
      handlers['tags:rename']({ profileId, id: must(retention).id, name: must(salty).name }),
    ).rejects.toThrow(ConflictError);
    // Renaming to the same name with another case is not a conflict with itself.
    await handlers['tags:rename']({ profileId, id: must(retention).id, name: 'INCHAÇO' });

    expect(await handlers['tags:remove']({ profileId, id: must(retention).id })).toBeNull();
    const names = (await handlers['tags:list']({ profileId })).map((t) => t.name);
    expect(names).not.toContain('INCHAÇO');
    const [entry] = await handlers['weights:list']({ profileId });
    expect(entry?.id).toBe(weighing.id);
    expect(entry?.tags).toEqual([]);
  });

  it('keeps projects and tags isolated between profiles', async () => {
    const { handlers, profileId } = await setup();
    const other = await handlers['profiles:create']({ ...person, name: 'Ana' });
    const active = must(await handlers['projects:get-active']({ profileId }));
    const [tag] = await handlers['tags:list']({ profileId });

    await expect(
      handlers['projects:complete']({ profileId: other.id, id: active.id }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      handlers['tags:remove']({ profileId: other.id, id: must(tag).id }),
    ).rejects.toThrow(NotFoundError);
    expect(await handlers['projects:list']({ profileId: other.id })).toEqual([]);
  });
});
