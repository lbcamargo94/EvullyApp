import { afterEach, describe, expect, it } from 'vitest';
import { KyselySettingsRepository } from '../src/modules/settings/adapters/kysely-settings-repository';
import { createTestApp, fixedClock, sequentialIds } from './helpers';

describe('settings', () => {
  let dispose: () => Promise<void> = async () => {};
  afterEach(() => dispose());

  const setup = async () => {
    const app = await createTestApp();
    dispose = app.dispose;
    return app;
  };

  it('returns defaults on a new installation', async () => {
    const { handlers } = await setup();
    expect(await handlers['settings:get'](undefined)).toEqual({
      healthNoticeAcceptedAt: null,
      inactivityLockMinutes: 15,
    });
  });

  it('records the health notice and keeps the inactivity setting', async () => {
    const { handlers } = await setup();
    await handlers['settings:update']({ inactivityLockMinutes: 5 });
    expect(await handlers['settings:accept-health-notice'](undefined)).toEqual({
      healthNoticeAcceptedAt: '2026-10-07T10:00:00.000Z',
      inactivityLockMinutes: 5,
    });
    await handlers['settings:update']({ inactivityLockMinutes: 0 });
    expect((await handlers['settings:get'](undefined)).inactivityLockMinutes).toBe(0);
  });

  it('falls back to defaults when a stored value is invalid', async () => {
    const { db, handlers } = await setup();
    await handlers['settings:update']({ inactivityLockMinutes: 5 });
    await db.updateTable('settings').set({ value: '"abc"' }).execute();
    expect((await handlers['settings:get'](undefined)).inactivityLockMinutes).toBe(15);
  });

  it('keeps per-profile values isolated from each other and from global ones', async () => {
    const { db, handlers } = await setup();
    const repo = new KyselySettingsRepository(db, fixedClock(), sequentialIds());
    const a = await handlers['profiles:create']({
      name: 'A',
      birthDate: null,
      sex: null,
      heightCm: null,
    });
    const b = await handlers['profiles:create']({
      name: 'B',
      birthDate: null,
      sex: null,
      heightCm: null,
    });

    await repo.set(null, 'theme', 'system');
    await repo.set(a.id, 'theme', 'dark');
    await repo.set(b.id, 'theme', 'light');
    await repo.set(a.id, 'theme', 'light');

    expect(await repo.get(null, 'theme')).toBe('system');
    expect(await repo.get(a.id, 'theme')).toBe('light');
    expect(await repo.get(b.id, 'theme')).toBe('light');
    expect(await db.selectFrom('settings').select('id').execute()).toHaveLength(3);
  });
});
