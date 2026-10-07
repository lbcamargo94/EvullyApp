import type { ProfileInput } from '@evully/contracts';
import { normalizeProfileDraft, type Profile } from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ProfileRepository } from '../ports/profile-repository';

export class CreateProfile {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: ProfileInput): Promise<Profile> {
    const now = this.clock.nowIso();
    const profile: Profile = {
      id: this.ids.next(),
      ...normalizeProfileDraft(input, this.clock.today()),
      unitSystem: 'metric',
      createdAt: now,
      updatedAt: now,
    };
    await this.profiles.insert(profile);
    return profile;
  }
}
