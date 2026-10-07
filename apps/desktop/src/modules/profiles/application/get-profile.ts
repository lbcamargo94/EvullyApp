import { NotFoundError, type Profile } from '@evully/domain';
import type { ProfileRepository } from '../ports/profile-repository';

export class GetProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute({ id }: { id: string }): Promise<Profile> {
    const profile = await this.profiles.findById(id);
    if (!profile) throw new NotFoundError('profile.not_found', 'Profile not found');
    return profile;
  }
}
