import type { Profile } from '@evully/domain';

export interface ProfileRepository {
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
  /** Active (not archived) profile, or null. */
  findById(id: string): Promise<Profile | null>;
  /** Active profiles in creation order. */
  listActive(): Promise<Profile[]>;
}
