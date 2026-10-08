import { defaultTrackingProposal } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../ports/tracking-repository';
import { saveTrackingSetup } from './save-tracking-setup';

/** Skipping steps 2–7 applies the defaults of README §8.2.3; no project is created. */
export class SkipTracking {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ profileId }: { profileId: string }): Promise<void> {
    const profile = await new GetProfile(this.profiles).execute({ id: profileId });
    await saveTrackingSetup(
      { tracking: this.tracking, clock: this.clock, ids: this.ids },
      {
        profileId,
        status: 'skipped',
        answers: {},
        project: null,
        proposal: defaultTrackingProposal(profile.sex),
      },
    );
  }
}
