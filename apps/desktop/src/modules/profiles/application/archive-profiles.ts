import type { ArchivedProfile, DeleteProfileInput, ProfileSummary } from '@evully/contracts';
import { confirmsProfileName, NotFoundError, ValidationError } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { PreDeleteBackup, ProfileRepository } from '../ports/profile-repository';

const notFound = () => new NotFoundError('profile.not_found', 'Profile not found');

/** Archive = soft delete: the profile leaves the selection screen, data is kept (README §8.3.1). */
export class ArchiveProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id }: { id: string }): Promise<null> {
    if (!(await this.profiles.archive(id, this.clock.nowIso()))) throw notFound();
    return null;
  }
}

export class RestoreProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id }: { id: string }): Promise<ProfileSummary> {
    const archived = await this.profiles.findArchivedById(id);
    if (!archived || !(await this.profiles.restore(id, this.clock.nowIso()))) throw notFound();
    return { id: archived.id, name: archived.name };
  }
}

export class ListArchivedProfiles {
  constructor(private readonly profiles: ProfileRepository) {}

  execute(): Promise<ArchivedProfile[]> {
    return this.profiles.listArchived();
  }
}

/**
 * The only physical deletion in the app (README §8.3.1). Only archived
 * profiles can be deleted; the typed name must match, and a backup is written
 * first. If the backup fails, nothing is deleted.
 */
export class DeleteProfilePermanently {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly backup: PreDeleteBackup,
  ) {}

  async execute({ id, confirmName }: DeleteProfileInput): Promise<null> {
    const archived = await this.profiles.findArchivedById(id);
    if (!archived) throw notFound();
    if (!confirmsProfileName(confirmName, archived.name)) {
      throw new ValidationError('profile.name_mismatch', 'Typed name does not match');
    }
    await this.backup();
    await this.profiles.deletePermanently(id);
    return null;
  }
}
