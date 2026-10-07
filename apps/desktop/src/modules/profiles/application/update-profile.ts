import type { UpdateProfileInput } from '@evully/contracts';
import { normalizeProfileDraft, type Profile } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { ProfileRepository } from '../ports/profile-repository';
import { GetProfile } from './get-profile';

export class UpdateProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ id, ...input }: UpdateProfileInput): Promise<Profile> {
    const current = await new GetProfile(this.profiles).execute({ id });
    const updated: Profile = {
      ...current,
      ...normalizeProfileDraft(input, this.clock.today()),
      updatedAt: this.clock.nowIso(),
    };
    await this.profiles.update(updated);
    return updated;
  }
}
