import { NotFoundError, ValidationError } from '@evully/domain';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers';

const lucas = { name: 'Lucas', birthDate: '1994-08-16', sex: 'male', heightCm: 175 } as const;

describe('profiles', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp();
    dispose = app.dispose;
    return app;
  };

  it('creates a profile with id, timestamps and metric units', async () => {
    const { handlers } = await setup();
    const profile = await handlers['profiles:create'](lucas);
    expect(profile).toEqual({
      id: '01900000-0000-7000-8000-000000000001',
      ...lucas,
      unitSystem: 'metric',
      createdAt: '2026-10-07T10:00:00.000Z',
      updatedAt: '2026-10-07T10:00:00.000Z',
    });
    expect(await handlers['profiles:get']({ id: profile.id })).toEqual(profile);
  });

  it('lists only names, in creation order', async () => {
    const { handlers } = await setup();
    await handlers['profiles:create'](lucas);
    await handlers['profiles:create']({ name: 'Ana', birthDate: null, sex: null, heightCm: null });
    const list = await handlers['profiles:list'](undefined);
    expect(list.map((p) => p.name)).toEqual(['Lucas', 'Ana']);
    expect(Object.keys(list[0] ?? {})).toEqual(['id', 'name']);
  });

  it('updates a profile', async () => {
    const { handlers } = await setup();
    const { id } = await handlers['profiles:create'](lucas);
    const updated = await handlers['profiles:update']({ id, ...lucas, heightCm: 176 });
    expect(updated.heightCm).toBe(176);
    expect((await handlers['profiles:get']({ id })).heightCm).toBe(176);
  });

  it('applies domain rules on create and update', async () => {
    const { handlers } = await setup();
    await expect(handlers['profiles:create']({ ...lucas, heightCm: 20 })).rejects.toThrow(
      ValidationError,
    );
    const { id } = await handlers['profiles:create'](lucas);
    await expect(
      handlers['profiles:update']({ id, ...lucas, birthDate: '2030-01-01' }),
    ).rejects.toThrow(ValidationError);
  });

  it('hides archived profiles', async () => {
    const { db, handlers } = await setup();
    const { id } = await handlers['profiles:create'](lucas);
    await db.updateTable('profiles').set({ deleted_at: '2026-10-07T11:00:00.000Z' }).execute();
    expect(await handlers['profiles:list'](undefined)).toEqual([]);
    await expect(handlers['profiles:get']({ id })).rejects.toThrow(NotFoundError);
  });
});
