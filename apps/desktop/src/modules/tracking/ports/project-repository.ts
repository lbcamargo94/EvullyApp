import type { Project } from '@evully/domain';

export interface ProjectRepository {
  /** The profile's active project, or null (README §7.1: at most one). */
  findActive(profileId: string): Promise<Project | null>;
  findById(profileId: string, id: string): Promise<Project | null>;
  /** Projects of the profile, newest start first. */
  list(profileId: string): Promise<Project[]>;
  insert(project: Project): Promise<void>;
  update(project: Project): Promise<void>;
}
