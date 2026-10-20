import type { LocalDate, Project } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, ProjectsTable } from '../../../database/schema';
import type { ProjectRepository } from '../ports/project-repository';

const toProject = (row: Selectable<ProjectsTable>): Project => ({
  id: row.id,
  profileId: row.profile_id,
  name: row.name,
  objective: row.objective,
  startDate: row.start_date as LocalDate,
  targetDate: row.target_date as LocalDate,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (p: Project) => ({
  name: p.name,
  objective: p.objective,
  start_date: p.startDate,
  target_date: p.targetDate,
  status: p.status,
  notes: p.notes,
  updated_at: p.updatedAt,
});

/** Every query is scoped by `profile_id`. */
export class KyselyProjectRepository implements ProjectRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private base(profileId: string) {
    return this.db
      .selectFrom('projects')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  async findActive(profileId: string): Promise<Project | null> {
    const row = await this.base(profileId).where('status', '=', 'active').executeTakeFirst();
    return row ? toProject(row) : null;
  }

  async findById(profileId: string, id: string): Promise<Project | null> {
    const row = await this.base(profileId).where('id', '=', id).executeTakeFirst();
    return row ? toProject(row) : null;
  }

  async list(profileId: string): Promise<Project[]> {
    const rows = await this.base(profileId)
      .orderBy('start_date', 'desc')
      .orderBy('id', 'desc')
      .execute();
    return rows.map(toProject);
  }

  async insert(p: Project): Promise<void> {
    await this.db
      .insertInto('projects')
      .values({ id: p.id, profile_id: p.profileId, created_at: p.createdAt, ...toRow(p) })
      .execute();
  }

  async update(p: Project): Promise<void> {
    await this.db
      .updateTable('projects')
      .set(toRow(p))
      .where('id', '=', p.id)
      .where('profile_id', '=', p.profileId)
      .where('deleted_at', 'is', null)
      .execute();
  }
}
