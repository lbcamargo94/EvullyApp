import type { AcceptTrackingInput } from '@evully/contracts';
import { buildTrackingProposal, ConflictError, normalizeProjectDraft } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ProjectRepository } from '../ports/project-repository';
import type { TrackingRepository } from '../ports/tracking-repository';
import { saveTrackingSetup } from './save-tracking-setup';

/**
 * Applies the questionnaire after the user accepts the proposal. The proposal is
 * rebuilt here from the answers; the screen's preview is never trusted.
 */
export class AcceptTracking {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly projects: ProjectRepository,
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ profileId, answers }: AcceptTrackingInput): Promise<void> {
    const profile = await new GetProfile(this.profiles).execute({ id: profileId });
    const project = answers.project ? normalizeProjectDraft(answers.project) : null;
    const active = await this.projects.findActive(profileId);
    if (project && active) {
      throw new ConflictError('project.active_exists', 'Profile already has an active project');
    }
    const proposal = buildTrackingProposal(
      {
        objective: project?.objective ?? active?.objective ?? null,
        focusAreas: answers.focusAreas,
        weightDisplay: answers.weightDisplay,
      },
      profile.sex,
    );
    await saveTrackingSetup(
      { tracking: this.tracking, clock: this.clock, ids: this.ids },
      { profileId, status: 'completed', answers, project, proposal },
    );
  }
}
