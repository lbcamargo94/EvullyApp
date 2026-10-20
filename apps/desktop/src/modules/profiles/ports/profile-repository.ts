import type { Profile } from '@evully/domain';

export interface ArchivedProfileRecord {
  id: string;
  name: string;
  archivedAt: string;
}

export interface ProfileRepository {
  insert(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
  /** Active (not archived) profile, or null. */
  findById(id: string): Promise<Profile | null>;
  /** Active profiles in creation order. */
  listActive(): Promise<Profile[]>;
  /** Archived profiles, most recently archived first. */
  listArchived(): Promise<ArchivedProfileRecord[]>;
  findArchivedById(id: string): Promise<ArchivedProfileRecord | null>;
  /** Soft delete; false when there is no active profile with this id. */
  archive(id: string, now: string): Promise<boolean>;
  /** False when there is no archived profile with this id. */
  restore(id: string, now: string): Promise<boolean>;
  /** Removes an archived profile and all its data in one transaction. */
  deletePermanently(id: string): Promise<void>;
}

/** Backup taken before a permanent deletion; throws when it cannot be written. */
export type PreDeleteBackup = () => Promise<unknown>;
