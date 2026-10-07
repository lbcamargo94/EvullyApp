import type { ProfileSummary } from '@evully/contracts';
import type { ProfileRepository } from '../ports/profile-repository';

/** Profiles for the selection screen: names only, never personal data (README §8.1). */
export class ListProfiles {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(): Promise<ProfileSummary[]> {
    const profiles = await this.profiles.listActive();
    return profiles.map(({ id, name }) => ({ id, name }));
  }
}
