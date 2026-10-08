import type { Project } from '@evully/domain';
import type { ProjectRepository } from '../ports/project-repository';

export class GetActiveProject {
  constructor(private readonly projects: ProjectRepository) {}

  execute({ profileId }: { profileId: string }): Promise<Project | null> {
    return this.projects.findActive(profileId);
  }
}
