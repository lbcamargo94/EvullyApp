import type { LocalDate, Project } from '@evully/domain';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type { ProjectRepository } from '../ports/project-repository';

export class KyselyProjectRepository implements ProjectRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async findActive(profileId: string): Promise<Project | null> {
    const row = await this.db
      .selectFrom('projects')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('status', '=', 'active')
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    if (!row) return null;
    return {
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
    };
  }
}
