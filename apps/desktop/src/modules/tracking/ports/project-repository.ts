import type { Project } from '@evully/domain';

export interface ProjectRepository {
  /** The profile's active project, or null (README §7.1: at most one). */
  findActive(profileId: string): Promise<Project | null>;
}
