import type { SleepInput, SleepLogDto, UpdateSleepInput } from '@evully/contracts';
import { ConflictError, normalizeSleepDraft, NotFoundError } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { SleepRecord, SleepRepository } from '../ports/sleep-repository';

export interface SleepDeps {
  profiles: ProfileRepository;
  sleep: SleepRepository;
  clock: Clock;
  ids: IdGenerator;
}

const toDto = (s: SleepRecord): SleepLogDto => ({
  id: s.id,
  sleepDate: s.sleepDate,
  bedTime: s.bedTime,
  sleepTime: s.sleepTime,
  wakeTime: s.wakeTime,
  durationMinutes: s.durationMinutes,
  quality: s.quality,
  notes: s.notes,
});

const notFound = () => new NotFoundError('sleep.not_found', 'Night not found');

/** One active night per day; the client offers to edit the existing one. */
async function ensureFreeDay(deps: SleepDeps, profileId: string, date: string, id?: string) {
  const existing = await deps.sleep.findByDate(profileId, date);
  if (existing && existing.id !== id) {
    throw new ConflictError('sleep.duplicate', 'A night is already registered for this day');
  }
}

const normalize = (deps: SleepDeps, input: Omit<SleepInput, 'profileId'>) =>
  normalizeSleepDraft(input, deps.clock.today(), deps.clock.nowIso());

/** Active nights, newest first (README §12). */
export class ListSleep {
  constructor(private readonly deps: SleepDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<SleepLogDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return (await this.deps.sleep.list(profileId)).map(toDto);
  }
}

export class RegisterSleep {
  constructor(private readonly deps: SleepDeps) {}

  async execute({ profileId, ...input }: SleepInput): Promise<SleepLogDto> {
    const { profiles, sleep, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const night = normalize(this.deps, input);
    await ensureFreeDay(this.deps, profileId, night.sleepDate);
    const now = clock.nowIso();
    const record: SleepRecord = {
      ...night,
      id: ids.next(),
      profileId,
      createdAt: now,
      updatedAt: now,
    };
    await sleep.insert(record);
    return toDto(record);
  }
}

export class UpdateSleep {
  constructor(private readonly deps: SleepDeps) {}

  async execute({ profileId, id, ...input }: UpdateSleepInput): Promise<SleepLogDto> {
    const { sleep, clock } = this.deps;
    const current = await sleep.findById(profileId, id);
    if (!current) throw notFound();
    const night = normalize(this.deps, input);
    await ensureFreeDay(this.deps, profileId, night.sleepDate, id);
    const record = { ...current, ...night, updatedAt: clock.nowIso() };
    await sleep.update(record);
    return toDto(record);
  }
}

export class DeleteSleep {
  constructor(private readonly deps: SleepDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.sleep.softDelete(profileId, id, this.deps.clock.nowIso())))
      throw notFound();
    return null;
  }
}
