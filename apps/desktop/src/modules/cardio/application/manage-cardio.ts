import type {
  CardioInput,
  CardioOverview,
  CardioSessionDto,
  CardioTargetDto,
  CardioTargetInput,
  UpdateCardioInput,
} from '@evully/contracts';
import {
  effectiveAt,
  normalizeCardioDraft,
  normalizeCardioTarget,
  NotFoundError,
  weekStartOf,
  weekSummary,
  type LocalDate,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type {
  CardioRecord,
  CardioRepository,
  CardioTargetRecord,
  CardioTargetRepository,
} from '../ports/cardio-repository';

export interface CardioDeps {
  profiles: ProfileRepository;
  cardio: CardioRepository;
  targets: CardioTargetRepository;
  clock: Clock;
  ids: IdGenerator;
}

const toDto = (s: CardioRecord): CardioSessionDto => ({
  id: s.id,
  sessionDate: s.sessionDate,
  startedAt: s.startedAt,
  activityType: s.activityType,
  activityName: s.activityName,
  durationMinutes: s.durationMinutes,
  distanceKm: s.distanceKm,
  steps: s.steps,
  intensity: s.intensity,
  heartRateAverage: s.heartRateAverage,
  notes: s.notes,
});

const targetDto = (t: CardioTargetRecord): CardioTargetDto => ({
  id: t.id,
  effectiveFrom: t.effectiveFrom,
  sessionsPerWeek: t.sessionsPerWeek,
  minutesPerWeek: t.minutesPerWeek,
  createdAt: t.createdAt,
});

/** The target in force on the date; a cleared target (both null) counts as none. */
function targetOn(targets: readonly CardioTargetRecord[], date: LocalDate) {
  const t = effectiveAt(targets, date);
  return t && (t.sessionsPerWeek !== null || t.minutesPerWeek !== null) ? targetDto(t) : null;
}

const notFound = () => new NotFoundError('cardio.not_found', 'Cardio session not found');

/** This week and its target, plus every week with sessions, newest first (README §11.1). */
export class GetCardioOverview {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<CardioOverview> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const sessions = await this.deps.cardio.list(profileId);
    const today = this.deps.clock.today();
    const starts = [...new Set(sessions.map((s) => weekStartOf(s.sessionDate)))];
    return {
      thisWeek: weekSummary(sessions, weekStartOf(today)),
      target: targetOn(await this.deps.targets.list(profileId), today),
      weeks: starts.map((start) => ({
        summary: weekSummary(sessions, start),
        sessions: sessions.filter((s) => weekStartOf(s.sessionDate) === start).map(toDto),
      })),
    };
  }
}

export class RegisterCardio {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId, ...input }: CardioInput): Promise<CardioSessionDto> {
    const { profiles, cardio, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const now = clock.nowIso();
    const record: CardioRecord = {
      ...normalizeCardioDraft(input, clock.today()),
      id: ids.next(),
      profileId,
      createdAt: now,
      updatedAt: now,
    };
    await cardio.insert(record);
    return toDto(record);
  }
}

export class UpdateCardio {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId, id, ...input }: UpdateCardioInput): Promise<CardioSessionDto> {
    const { cardio, clock } = this.deps;
    const current = await cardio.findById(profileId, id);
    if (!current) throw notFound();
    const record = {
      ...current,
      ...normalizeCardioDraft(input, clock.today()),
      updatedAt: clock.nowIso(),
    };
    await cardio.update(record);
    return toDto(record);
  }
}

export class DeleteCardio {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.cardio.softDelete(profileId, id, this.deps.clock.nowIso())))
      throw notFound();
    return null;
  }
}

/**
 * A new weekly target from today on; older ones stay as history (README §11.1).
 * Both values null clears it, and then the result is null.
 */
export class SetCardioTarget {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId, ...values }: CardioTargetInput): Promise<CardioTargetDto | null> {
    const { profiles, targets, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const record: CardioTargetRecord = {
      id: ids.next(),
      profileId,
      effectiveFrom: clock.today(),
      ...normalizeCardioTarget(values),
      createdAt: clock.nowIso(),
    };
    await targets.insert(record);
    return targetOn([record], record.effectiveFrom);
  }
}
