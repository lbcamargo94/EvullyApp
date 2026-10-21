import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDatabase } from '../src/database/connection';
import { migrateToLatest } from '../src/database/migrator';
import { createTestApp, fixedClock } from './helpers';

describe('persistence (README §8.10, criterion 10)', () => {
  it('keeps the data after the database is closed and opened again', async () => {
    const app = await createTestApp(fixedClock('2026-10-21T12:00:00.000Z', '2026-10-21'));
    try {
      const { id: profileId } = await app.handlers['profiles:create']({
        name: 'Lucas',
        birthDate: null,
        sex: null,
        heightCm: null,
      });
      await app.handlers['tracking:skip']({ profileId });
      await app.handlers['weights:register']({
        profileId,
        measuredOn: '2026-10-21',
        measuredAt: '2026-10-21T07:00:00.000Z',
        weightKg: 88.4,
        tagIds: [],
        notes: null,
      });
      await app.handlers['settings:update']({ theme: 'dark' });
      await app.db.destroy(); // the app is closed

      const reopened = openDatabase(join(app.dir, 'evully.db'));
      try {
        expect(await migrateToLatest(reopened)).toEqual([]); // nothing to migrate again
        expect(await reopened.selectFrom('profiles').select('name').execute()).toEqual([
          { name: 'Lucas' },
        ]);
        expect(
          await reopened.selectFrom('body_weights').select(['profile_id', 'weight_kg']).execute(),
        ).toEqual([{ profile_id: profileId, weight_kg: 88.4 }]);
        expect(
          await reopened
            .selectFrom('settings')
            .select('value')
            .where('key', '=', 'theme')
            .execute(),
        ).toEqual([{ value: JSON.stringify('dark') }]);
      } finally {
        await reopened.destroy();
      }
    } finally {
      rmSync(app.dir, { recursive: true, force: true });
    }
  });
});
