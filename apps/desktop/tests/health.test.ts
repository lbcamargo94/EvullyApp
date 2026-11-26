import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock } from './helpers';

const person = { birthDate: null, sex: null, heightCm: null };
const ferritin = {
  analyteCode: 'ferritin',
  analyteName: '',
  value: 22,
  unit: 'ng/mL',
  referenceMin: 30,
  referenceMax: 400,
  referenceText: null,
};
const homocysteine = {
  analyteCode: null,
  analyteName: 'Homocisteína',
  value: 9.5,
  unit: 'µmol/L',
  referenceMin: null,
  referenceMax: 15,
  referenceText: null,
};

describe('health exams (README §24)', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp(fixedClock('2026-11-26T12:00:00.000Z', '2026-11-26'));
    dispose = app.dispose;
    const lucas = await app.handlers['profiles:create']({ ...person, name: 'Lucas' });
    const ana = await app.handlers['profiles:create']({ ...person, name: 'Ana' });
    return { ...app, lucas, ana };
  };

  it('starts hidden; turning it on records the notice, turning it off keeps the exams', async () => {
    const { handlers, lucas, ana } = await setup();
    expect(await handlers['health:settings']({ profileId: lucas.id })).toEqual({
      enabled: false,
      noticeAcceptedAt: null,
    });
    const on = await handlers['health:set-settings']({ profileId: lucas.id, enabled: true });
    expect(on).toEqual({ enabled: true, noticeAcceptedAt: '2026-11-26T12:00:00.000Z' });
    await handlers['health:register']({
      profileId: lucas.id,
      collectedOn: '2026-11-20',
      laboratory: 'Lab Centro',
      notes: null,
      results: [ferritin],
    });
    const off = await handlers['health:set-settings']({ profileId: lucas.id, enabled: false });
    expect(off.enabled).toBe(false);
    expect(await handlers['health:list']({ profileId: lucas.id })).toHaveLength(1);
    expect((await handlers['health:settings']({ profileId: ana.id })).enabled).toBe(false);
  });

  it('stores the report as typed and flags only against the laboratory range', async () => {
    const { handlers, lucas } = await setup();
    const exam = await handlers['health:register']({
      profileId: lucas.id,
      collectedOn: '2026-11-20',
      laboratory: '  Lab Centro ',
      notes: null,
      results: [ferritin, homocysteine],
    });
    expect(exam).toMatchObject({ collectedOn: '2026-11-20', laboratory: 'Lab Centro' });
    expect(exam.results.map((r) => [r.analyteName, r.value, r.flag])).toEqual([
      ['Ferritina', 22, 'below'],
      ['Homocisteína', 9.5, 'within'],
    ]);
    await handlers['health:register']({
      profileId: lucas.id,
      collectedOn: '2026-08-10',
      laboratory: null,
      notes: null,
      results: [{ ...ferritin, value: 45, referenceMin: null, referenceMax: null }],
    });
    const list = await handlers['health:list']({ profileId: lucas.id });
    expect(list.map((e) => e.collectedOn)).toEqual(['2026-11-20', '2026-08-10']);
    expect(list[1]?.results[0]?.flag).toBe('unknown');
  });

  it('edits replace the results and deletes are soft', async () => {
    const { handlers, lucas, db } = await setup();
    const exam = await handlers['health:register']({
      profileId: lucas.id,
      collectedOn: '2026-11-20',
      laboratory: null,
      notes: null,
      results: [ferritin, homocysteine],
    });
    const edited = await handlers['health:update']({
      profileId: lucas.id,
      id: exam.id,
      collectedOn: '2026-11-21',
      laboratory: null,
      notes: 'Em jejum',
      results: [{ ...ferritin, value: 35 }],
    });
    expect(edited.results.map((r) => [r.value, r.flag])).toEqual([[35, 'within']]);
    const rows = await db.selectFrom('health_exam_results').select('deleted_at').execute();
    expect(rows.filter((r) => r.deleted_at !== null)).toHaveLength(2);

    expect(await handlers['health:delete']({ profileId: lucas.id, id: exam.id })).toBeNull();
    expect(await handlers['health:list']({ profileId: lucas.id })).toEqual([]);
    const kept = await db.selectFrom('health_exams').select('deleted_at').execute();
    expect(kept).toHaveLength(1);
    expect(kept[0]?.deleted_at).not.toBeNull();
    await expect(handlers['health:delete']({ profileId: lucas.id, id: exam.id })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('isolates profiles (README §6.1)', async () => {
    const { handlers, lucas, ana } = await setup();
    const exam = await handlers['health:register']({
      profileId: lucas.id,
      collectedOn: '2026-11-20',
      laboratory: null,
      notes: null,
      results: [ferritin],
    });
    expect(await handlers['health:list']({ profileId: ana.id })).toEqual([]);
    await expect(
      handlers['health:update']({
        profileId: ana.id,
        id: exam.id,
        collectedOn: '2026-11-20',
        laboratory: null,
        notes: null,
        results: [ferritin],
      }),
    ).rejects.toThrow(NotFoundError);
    await expect(handlers['health:delete']({ profileId: ana.id, id: exam.id })).rejects.toThrow(
      NotFoundError,
    );
    expect(await handlers['health:list']({ profileId: lucas.id })).toHaveLength(1);
  });

  it('refuses a future date and an inverted range', async () => {
    const { handlers, lucas } = await setup();
    const base = { profileId: lucas.id, laboratory: null, notes: null };
    await expect(
      handlers['health:register']({ ...base, collectedOn: '2026-11-27', results: [ferritin] }),
    ).rejects.toThrow(ValidationError);
    await expect(
      handlers['health:register']({
        ...base,
        collectedOn: '2026-11-20',
        results: [{ ...ferritin, referenceMin: 500 }],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
