import type { CardioDraft, CardioTargetValues, LocalDate } from '@evully/domain';

export interface CardioRecord extends Omit<CardioDraft, 'sessionDate'> {
  id: string;
  profileId: string;
  sessionDate: LocalDate;
  createdAt: string;
  updatedAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface CardioRepository {
  /** Active sessions, newest first. */
  list(profileId: string): Promise<CardioRecord[]>;
  findById(profileId: string, id: string): Promise<CardioRecord | null>;
  insert(session: CardioRecord): Promise<void>;
  update(session: CardioRecord): Promise<void>;
  softDelete(profileId: string, id: string, now: string): Promise<boolean>;
}

export interface CardioTargetRecord extends CardioTargetValues {
  id: string;
  profileId: string;
  effectiveFrom: LocalDate;
  createdAt: string;
}

/** History only: targets are never edited or deleted (README §11.1). */
export interface CardioTargetRepository {
  /** All targets of the profile in creation order. */
  list(profileId: string): Promise<CardioTargetRecord[]>;
  insert(target: CardioTargetRecord): Promise<void>;
}
