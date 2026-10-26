import type {
  CardioInput,
  CardioOverview,
  CardioSessionDto,
  UpdateCardioInput,
} from '@evully/contracts';
import { normalizeCardioDraft, NotFoundError, weekStartOf, weekSummary } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { CardioRecord, CardioRepository } from '../ports/cardio-repository';

export interface CardioDeps {
  profiles: ProfileRepository;
  cardio: CardioRepository;
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

const notFound = () => new NotFoundError('cardio.not_found', 'Cardio session not found');

/** This week plus every week with sessions, newest first (README §11.1). */
export class GetCardioOverview {
  constructor(private readonly deps: CardioDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<CardioOverview> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const sessions = await this.deps.cardio.list(profileId);
    const starts = [...new Set(sessions.map((s) => weekStartOf(s.sessionDate)))];
    return {
      thisWeek: weekSummary(sessions, weekStartOf(this.deps.clock.today())),
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
