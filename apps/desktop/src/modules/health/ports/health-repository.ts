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
  /** Soft-deletes the exam, its results and its document. */
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}

export interface HealthDocumentRecord {
  id: string;
  profileId: string;
  examId: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

/** The laboratory PDFs (README §24.2), scoped by profile like the exams. */
export interface HealthDocumentRepository {
  /** Active documents of the profile, without their content. */
  list(profileId: string): Promise<HealthDocumentRecord[]>;
  content(profileId: string, id: string): Promise<{ fileName: string; bytes: Uint8Array } | null>;
  /** Soft-deletes the exam's current document and inserts this one, in one transaction. */
  replace(document: HealthDocumentRecord, bytes: Uint8Array): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}

/** Native dialogs and the viewer; paths never come from the renderer (SECURITY.md §2.3). */
export interface HealthDocumentFiles {
  /** Open dialog for one PDF, refused above the size limit before it is read; null when cancelled. */
  choosePdf(): Promise<{ fileName: string; bytes: Uint8Array; sha256: string } | null>;
  /** Save dialog; false when cancelled. */
  saveCopy(fileName: string, bytes: Uint8Array): Promise<boolean>;
  /** Writes a copy in the app's private temp folder and opens it in the system PDF viewer. */
  open(fileName: string, bytes: Uint8Array): Promise<void>;
}
