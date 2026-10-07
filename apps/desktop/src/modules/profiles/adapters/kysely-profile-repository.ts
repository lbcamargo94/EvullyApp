import type { LocalDate, Profile } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, ProfilesTable } from '../../../database/schema';
import type { ProfileRepository } from '../ports/profile-repository';

const toProfile = (row: Selectable<ProfilesTable>): Profile => ({
  id: row.id,
  name: row.name,
  birthDate: row.birth_date as LocalDate | null,
  sex: row.sex,
  heightCm: row.height_cm,
  unitSystem: row.unit_system,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (p: Profile) => ({
  name: p.name,
  birth_date: p.birthDate,
  sex: p.sex,
  height_cm: p.heightCm,
  unit_system: p.unitSystem,
  updated_at: p.updatedAt,
});

export class KyselyProfileRepository implements ProfileRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async insert(profile: Profile): Promise<void> {
    await this.db
      .insertInto('profiles')
      .values({ id: profile.id, created_at: profile.createdAt, ...toRow(profile) })
      .execute();
  }

  async update(profile: Profile): Promise<void> {
    await this.db
      .updateTable('profiles')
      .set(toRow(profile))
      .where('id', '=', profile.id)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async findById(id: string): Promise<Profile | null> {
    const row = await this.db
      .selectFrom('profiles')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row ? toProfile(row) : null;
  }

  async listActive(): Promise<Profile[]> {
    const rows = await this.db
      .selectFrom('profiles')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('created_at')
      .orderBy('id')
      .execute();
    return rows.map(toProfile);
  }
}
