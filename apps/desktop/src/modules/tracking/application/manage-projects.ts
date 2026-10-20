import type { ProjectCreateInput, ProjectUpdateInput } from '@evully/contracts';
import { ConflictError, normalizeProjectDraft, NotFoundError, type Project } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ProjectRepository } from '../ports/project-repository';

async function findProject(projects: ProjectRepository, profileId: string, id: string) {
  const project = await projects.findById(profileId, id);
  if (!project) throw new NotFoundError('project.not_found', 'Project not found');
  return project;
}

/** New project; only when the profile has no active one (README §7.1). */
export class CreateProject {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ profileId, ...draft }: ProjectCreateInput): Promise<Project> {
    await new GetProfile(this.profiles).execute({ id: profileId });
    if (await this.projects.findActive(profileId)) {
      throw new ConflictError('project.active_exists', 'Profile already has an active project');
    }
    const now = this.clock.nowIso();
    const project: Project = {
      id: this.ids.next(),
      profileId,
      ...normalizeProjectDraft(draft),
      status: 'active',
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.projects.insert(project);
    return project;
  }
}

/** Edits a project. Changing dates only recalculates the dashboard; no record changes. */
export class UpdateProject {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id, ...draft }: ProjectUpdateInput): Promise<Project> {
    const current = await findProject(this.projects, profileId, id);
    const updated: Project = {
      ...current,
      ...normalizeProjectDraft(draft),
      updatedAt: this.clock.nowIso(),
    };
    await this.projects.update(updated);
    return updated;
  }
}

/** Marks the active project as completed so a new one can start. */
export class CompleteProject {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<Project> {
    const current = await findProject(this.projects, profileId, id);
    if (current.status !== 'active') {
      throw new ConflictError('project.not_active', 'Project is not active');
    }
    const completed: Project = { ...current, status: 'completed', updatedAt: this.clock.nowIso() };
    await this.projects.update(completed);
    return completed;
  }
}

export class ListProjects {
  constructor(private readonly projects: ProjectRepository) {}

  execute({ profileId }: { profileId: string }): Promise<Project[]> {
    return this.projects.list(profileId);
  }
}
