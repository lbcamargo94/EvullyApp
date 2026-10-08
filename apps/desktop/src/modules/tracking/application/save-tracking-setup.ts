import {
  TRACKING_QUESTIONNAIRE_VERSION,
  TRACKING_RULES_VERSION,
  type Project,
  type TrackingProposal,
} from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../ports/tracking-repository';

/** Shared by accept and skip: records answers, project, config and measurements together. */
export async function saveTrackingSetup(
  deps: { tracking: TrackingRepository; clock: Clock; ids: IdGenerator },
  input: {
    profileId: string;
    status: 'completed' | 'skipped';
    answers: unknown;
    project: Omit<
      Project,
      'id' | 'profileId' | 'status' | 'notes' | 'createdAt' | 'updatedAt'
    > | null;
    proposal: TrackingProposal;
  },
): Promise<void> {
  const { tracking, clock, ids } = deps;
  const now = clock.nowIso();
  const questionnaireId = ids.next();
  await tracking.saveSetup({
    questionnaire: {
      id: questionnaireId,
      profileId: input.profileId,
      version: TRACKING_QUESTIONNAIRE_VERSION,
      answers: input.answers,
      status: input.status,
      completedAt: now,
    },
    project: input.project && {
      id: ids.next(),
      profileId: input.profileId,
      ...input.project,
      status: 'active',
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
    config: {
      id: ids.next(),
      profileId: input.profileId,
      effectiveFrom: clock.today(),
      weightDisplay: input.proposal.weightDisplay,
      focusAreas: input.proposal.focusAreas,
      source: 'questionnaire',
      ruleVersion: TRACKING_RULES_VERSION,
      questionnaireId,
      createdAt: now,
    },
    measurementCodes: input.proposal.measurementCodes,
    tags: input.proposal.tags,
  });
}
