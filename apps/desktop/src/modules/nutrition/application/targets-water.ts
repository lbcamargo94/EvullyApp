import type {
  NutritionDay,
  NutritionTargetDto,
  NutritionTargetInput,
  WaterLogInput,
} from '@evully/contracts';
import {
  effectiveAt,
  normalizeNutritionTarget,
  normalizeWaterLog,
  NotFoundError,
  parseLocalDate,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { NutritionTargetRecord } from '../ports/targets-water-repository';
import { nutritionDay, type FoodLogDeps } from './food-logs';

const toDto = (t: NutritionTargetRecord): NutritionTargetDto => ({
  id: t.id,
  effectiveFrom: t.effectiveFrom,
  caloriesKcal: t.caloriesKcal,
  proteinG: t.proteinG,
  carbohydrateG: t.carbohydrateG,
  fatG: t.fatG,
  waterMl: t.waterMl,
  createdAt: t.createdAt,
});

/** Target in force today, or null. */
export class GetNutritionTarget {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<NutritionTargetDto | null> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const target = effectiveAt(await this.deps.targets.list(profileId), this.deps.clock.today());
    return target && toDto(target);
  }
}

/**
 * A new target from today on; older targets stay as history, so past days
 * keep the target they had (README §9.6).
 */
export class SetNutritionTarget {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId, ...values }: NutritionTargetInput): Promise<NutritionTargetDto> {
    const { profiles, targets, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const record = {
      id: ids.next(),
      profileId,
      effectiveFrom: clock.today(),
      ...normalizeNutritionTarget(values),
      createdAt: clock.nowIso(),
    };
    await targets.insert(record);
    return toDto(record);
  }
}

export class AddWaterLog {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId, date, amountMl }: WaterLogInput): Promise<NutritionDay> {
    const { profiles, water, clock, ids } = this.deps;
    await new GetProfile(profiles).execute({ id: profileId });
    const logDate = parseLocalDate(date);
    const now = clock.nowIso();
    await water.insert(
      {
        id: ids.next(),
        profileId,
        logDate,
        amountMl: normalizeWaterLog(amountMl, logDate, clock.today()),
        loggedAt: now,
      },
      now,
    );
    return nutritionDay(this.deps, profileId, logDate);
  }
}

export class RemoveWaterLog {
  constructor(private readonly deps: FoodLogDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<NutritionDay> {
    const { water, clock } = this.deps;
    const log = await water.findById(profileId, id);
    if (!log) throw new NotFoundError('water.not_found', 'Water log not found');
    await water.softDelete(profileId, id, clock.nowIso());
    return nutritionDay(this.deps, profileId, log.logDate);
  }
}
