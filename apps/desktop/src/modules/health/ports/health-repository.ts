import type { HealthResultDraft, NormalizedHealthExam } from '@evully/domain';

export interface HealthResultRecord extends HealthResultDraft {
  id: string;
}

export interface HealthExamRecord extends Omit<NormalizedHealthExam, 'results'> {
  id: string;
  profileId: string;
  results: HealthResultRecord[];
  createdAt: string;
  updatedAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface HealthExamRepository {
  /** Active exams with their active results, newest collection first. */
  list(profileId: string): Promise<HealthExamRecord[]>;
  findById(profileId: string, id: string): Promise<HealthExamRecord | null>;
  insert(exam: HealthExamRecord): Promise<void>;
  /** Saves the exam and replaces its results (the old ones are soft-deleted). */
  update(exam: HealthExamRecord): Promise<void>;
  /** Soft-deletes the exam and its results. */
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}
