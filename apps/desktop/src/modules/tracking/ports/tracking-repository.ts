import type { BodyRegion, FocusArea, LocalDate, Project, WeightDisplay } from '@evully/domain';

export interface TrackingConfigRecord {
  id: string;
  profileId: string;
  effectiveFrom: LocalDate;
  weightDisplay: WeightDisplay;
  focusAreas: FocusArea[];
  source: 'questionnaire' | 'manual' | 'template' | 'professional';
  ruleVersion: string | null;
  questionnaireId: string | null;
  createdAt: string;
}

export interface MeasurementType {
  id: string;
  code: string;
  name: string;
  bodyRegion: BodyRegion;
  instructions: string;
  csvName: string;
}

/** Everything accepting (or skipping) the questionnaire writes, saved atomically. */
export interface TrackingSetup {
  questionnaire: {
    id: string;
    profileId: string;
    version: string;
    answers: unknown;
    status: 'completed' | 'skipped';
    completedAt: string;
  };
  project: Project | null;
  config: TrackingConfigRecord;
  /** Measurement codes the profile tracks, in display order; others become inactive. */
  measurementCodes: string[];
  /** Tag names to create if the profile does not have them yet. */
  tags: string[];
}

export interface TrackingRepository {
  /** Writes the whole setup in one transaction: all of it or nothing. */
  saveSetup(setup: TrackingSetup): Promise<void>;
  listConfigs(profileId: string): Promise<TrackingConfigRecord[]>;
  latestQuestionnaireStatus(profileId: string): Promise<'completed' | 'skipped' | null>;
  listActiveMeasurementTypes(profileId: string): Promise<MeasurementType[]>;
}
