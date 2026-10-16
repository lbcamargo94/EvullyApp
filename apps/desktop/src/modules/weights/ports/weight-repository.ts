import type { LocalDate } from '@evully/domain';

export interface TagRef {
  id: string;
  name: string;
}

export interface WeightEntryRecord {
  id: string;
  profileId: string;
  measuredOn: LocalDate;
  measuredAt: string;
  weightKg: number;
  notes: string | null;
  tags: TagRef[];
  createdAt: string;
  updatedAt: string;
}

export type WeightEntryData = Omit<WeightEntryRecord, 'tags'>;

/** Every method is scoped by `profileId`; records of other profiles are never visible. */
export interface WeightRepository {
  /** Inserts the weighing and its tag links in one transaction. */
  insert(entry: WeightEntryData, tagIds: readonly string[]): Promise<void>;
  /** Inserts many weighings (CSV import) in one transaction: all or nothing. */
  insertMany(entries: readonly WeightEntryData[]): Promise<void>;
  /** Updates the weighing and replaces its tag links in one transaction. */
  update(entry: WeightEntryData, tagIds: readonly string[]): Promise<void>;
  /** Soft delete; false if the weighing does not exist for this profile. */
  softDelete(profileId: string, id: string, deletedAt: string): Promise<boolean>;
  findById(profileId: string, id: string): Promise<WeightEntryRecord | null>;
  /** Active weighings, most recent first. */
  listByProfile(profileId: string): Promise<WeightEntryRecord[]>;
}

export interface TagRepository {
  listByProfile(profileId: string): Promise<TagRef[]>;
  /** The subset of `ids` that are active tags of this profile. */
  filterOwned(profileId: string, ids: readonly string[]): Promise<string[]>;
  /** Adds a tag at the end of the profile's list. */
  insert(tag: TagRef & { profileId: string; createdAt: string }): Promise<void>;
}
