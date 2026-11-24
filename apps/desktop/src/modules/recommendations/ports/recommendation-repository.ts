import type { RecommendationDecision, RecommendationStatus, SignalLevel } from '@evully/domain';

export interface RecommendationRecord {
  id: string;
  profileId: string;
  ruleId: string;
  ruleVersion: number;
  subjectKey: string;
  level: SignalLevel;
  /** Parsed JSON; validated by the rule's schema before use. */
  evidence: unknown;
  detectedOn: string;
  status: RecommendationStatus;
  statusOn: string;
  snoozedUntil: string | null;
  createdAt: string;
}

export interface StatusChange {
  id: string;
  status: RecommendationStatus;
  statusOn: string;
  snoozedUntil: string | null;
}

export interface DecisionRecord {
  id: string;
  profileId: string;
  eventId: string;
  decision: RecommendationDecision;
  decidedAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface RecommendationRepository {
  /** Signals of the profile, oldest first. */
  list(profileId: string): Promise<RecommendationRecord[]>;
  findById(profileId: string, id: string): Promise<RecommendationRecord | null>;
  /** New signals and status changes of one evaluation, in one transaction. */
  apply(
    profileId: string,
    created: readonly RecommendationRecord[],
    changes: readonly StatusChange[],
    now: string,
  ): Promise<void>;
  /** The user's decision and the status it leads to, in one transaction. */
  decide(decision: DecisionRecord, change: StatusChange, now: string): Promise<void>;
}
