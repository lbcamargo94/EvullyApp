import {
  recommendationRuleSchema,
  recommendationSettingsSchema,
  signalEvidenceSchema,
  type DecideRecommendationInput,
  type RecommendationDto,
  type RecommendationList,
  type RecommendationSettings,
} from '@evully/contracts';
import {
  applyDecision,
  ConflictError,
  evaluateRules,
  NotFoundError,
  reconcileSignals,
  dailyWeights,
  sessionStats,
  RULE_VERSIONS,
  type ProgressionCandidate,
  type RecommendationRuleId,
  type RuleInputs,
  type StoredSignal,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { SettingsRepository } from '../../settings/ports/settings-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { MeasurementRepository } from '../../measurements/ports/measurement-repository';
import type { ProjectRepository } from '../../tracking/ports/project-repository';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { WeightRepository } from '../../weights/ports/weight-repository';
import type { ExerciseRepository } from '../../workouts/ports/exercise-repository';
import type { SessionRepository } from '../../workouts/ports/session-repository';
import type { WorkoutPlanRepository } from '../../workouts/ports/workout-plan-repository';
import type {
  RecommendationRecord,
  RecommendationRepository,
} from '../ports/recommendation-repository';

export interface RecommendationDeps {
  profiles: ProfileRepository;
  recommendations: RecommendationRepository;
  settings: SettingsRepository;
  projects: ProjectRepository;
  weights: WeightRepository;
  measurements: MeasurementRepository;
  tracking: TrackingRepository;
  plans: WorkoutPlanRepository;
  sessions: SessionRepository;
  exercises: ExerciseRepository;
  clock: Clock;
  ids: IdGenerator;
}

/** Per-profile setting with the rules the user turned off (README §20.2). */
export const DISABLED_RULES_KEY = 'recommendations_disabled_rules';
/** Decided and resolved signals kept on screen. */
const HISTORY_LIMIT = 50;

async function disabledRules(deps: RecommendationDeps, profileId: string) {
  const parsed = recommendationSettingsSchema.shape.disabledRules.safeParse(
    await deps.settings.get(profileId, DISABLED_RULES_KEY),
  );
  return parsed.success ? parsed.data : [];
}

const latestDate = (dates: readonly string[]) =>
  dates.reduce<string | null>((latest, d) => (latest === null || d > latest ? d : latest), null);

/** Exercises of the active plans with the sets of their latest finished session. */
async function progressionCandidates(
  deps: RecommendationDeps,
  profileId: string,
): Promise<ProgressionCandidate[]> {
  const plans = (await deps.plans.list(profileId)).filter((p) => p.status === 'active');
  const exercises = new Map((await deps.exercises.listAll(profileId)).map((e) => [e.id, e]));
  const candidates: ProgressionCandidate[] = [];
  for (const item of plans.flatMap((p) => p.days.flatMap((d) => d.exercises))) {
    if (!item.exerciseActive) continue;
    const [latest] = await deps.sessions.history(profileId, item.exerciseId);
    const own = await deps.exercises.profileIncrement(profileId, item.exerciseId);
    candidates.push({
      planExerciseId: item.id,
      exerciseId: item.exerciseId,
      exerciseName: item.exerciseName,
      prescription: item.prescription,
      last: latest
        ? { date: deps.clock.isoToLocal(latest.startedAt).date, sets: latest.sets }
        : null,
      incrementKg: own ?? exercises.get(item.exerciseId)?.loadIncrementKg ?? null,
    });
  }
  return candidates;
}

/** What the rules read: latest records and the active plans (README §20.2). */
/** Finished workouts by local date with their volume, and the active plans' weekdays. */
async function trainingInputs(
  deps: RecommendationDeps,
  profileId: string,
): Promise<Pick<RuleInputs, 'sessions' | 'plans'>> {
  const [finished, plans, exercises] = await Promise.all([
    deps.sessions.finishedSessions(profileId),
    deps.plans.list(profileId),
    deps.exercises.listAll(profileId),
  ]);
  const groups = new Map(exercises.map((e) => [e.id, e.muscleGroup]));
  return {
    sessions: finished.map((session) => ({
      date: deps.clock.isoToLocal(session.startedAt).date,
      exercises: session.exercises.map(({ exerciseId, sets }) => ({
        exerciseId,
        name: '',
        muscleGroup: groups.get(exerciseId) ?? 'cardio_other',
        volumeKg: sessionStats({ sessionId: session.id, startedAt: session.startedAt, sets })
          .volumeKg,
        completedSets: sets.filter((set) => set.completed).length,
        loadedSets: [],
      })),
    })),
    plans: plans
      .filter((p) => p.status === 'active')
      .map((p) => ({
        weekdays: p.days.flatMap((d) => (d.weekday === null ? [] : [d.weekday])),
        since: deps.clock.isoToLocal(p.createdAt).date,
      })),
  };
}

/** What the rules read: latest records, weights, the active project and plans (README §20.2). */
async function ruleInputs(deps: RecommendationDeps, profileId: string): Promise<RuleInputs> {
  const [weighings, sessions, tracked, project] = await Promise.all([
    deps.weights.listByProfile(profileId),
    deps.measurements.listByProfile(profileId),
    deps.tracking.listActiveMeasurementTypes(profileId),
    deps.projects.findActive(profileId),
  ]);
  const band =
    project && project.weeklyRateMinKg !== null && project.weeklyRateMaxKg !== null
      ? { minKg: project.weeklyRateMinKg, maxKg: project.weeklyRateMaxKg }
      : null;
  return {
    lastWeighing: latestDate(weighings.map((w) => w.measuredOn)),
    lastMeasurement: tracked.length > 0 ? latestDate(sessions.map((s) => s.measuredOn)) : null,
    progressions: await progressionCandidates(deps, profileId),
    weights: dailyWeights(weighings).map((d) => ({ date: d.date, value: d.weightKg })),
    objective: project?.objective ?? null,
    rateBand: band,
    ...(await trainingInputs(deps, profileId)),
  };
}

/** Saved signals of known rules, as the engine reads them. */
function storedSignals(records: readonly RecommendationRecord[]): StoredSignal[] {
  return records.flatMap((r) => {
    const rule = recommendationRuleSchema.safeParse(r.ruleId);
    return rule.success
      ? [
          {
            id: r.id,
            ruleId: rule.data,
            subjectKey: r.subjectKey,
            status: r.status,
            statusOn: r.statusOn,
            snoozedUntil: r.snoozedUntil,
          },
        ]
      : [];
  });
}

/** A saved signal for the screen; a row whose evidence fails its schema is left out. */
function toDto(r: RecommendationRecord): RecommendationDto | null {
  const evidence = signalEvidenceSchema.safeParse({ ruleId: r.ruleId, evidence: r.evidence });
  if (!evidence.success) return null;
  return {
    id: r.id,
    ruleVersion: r.ruleVersion,
    subjectKey: r.subjectKey,
    level: r.level,
    detectedOn: r.detectedOn,
    status: r.status,
    statusOn: r.statusOn,
    snoozedUntil: r.snoozedUntil,
    ...evidence.data,
  };
}

function toList(records: readonly RecommendationRecord[]): RecommendationList {
  const dtos = records.flatMap((r) => toDto(r) ?? []).reverse();
  return {
    open: dtos.filter((r) => r.status === 'open'),
    history: dtos
      .filter((r) => r.status !== 'open')
      .sort((a, b) => b.statusOn.localeCompare(a.statusOn))
      .slice(0, HISTORY_LIMIT),
  };
}

/**
 * Evaluates the enabled rules and returns the profile's signals. Running it
 * again the same day changes nothing (README §20.2).
 */
export class ListRecommendations {
  constructor(private readonly deps: RecommendationDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<RecommendationList> {
    const { recommendations, clock, ids } = this.deps;
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const today = clock.today();
    const now = clock.nowIso();
    const signals = evaluateRules(
      await ruleInputs(this.deps, profileId),
      today,
      await disabledRules(this.deps, profileId),
    );
    const plan = reconcileSignals(
      storedSignals(await recommendations.list(profileId)),
      signals,
      today,
    );
    const created: RecommendationRecord[] = plan.create.map((s) => ({
      id: ids.next(),
      profileId,
      ruleId: s.ruleId,
      ruleVersion: RULE_VERSIONS[s.ruleId],
      subjectKey: s.subjectKey,
      level: s.level,
      evidence: s.evidence,
      detectedOn: today,
      status: 'open',
      statusOn: today,
      snoozedUntil: null,
      createdAt: now,
    }));
    await recommendations.apply(
      profileId,
      created,
      [
        ...plan.resolve.map((id) => ({
          id,
          status: 'resolved' as const,
          statusOn: today,
          snoozedUntil: null,
        })),
        ...plan.reopen.map((id) => ({
          id,
          status: 'open' as const,
          statusOn: today,
          snoozedUntil: null,
        })),
      ],
      now,
    );
    return toList(await recommendations.list(profileId));
  }
}

/** Dismisses or snoozes an open signal; the decision is kept as history. */
export class DecideRecommendation {
  constructor(private readonly deps: RecommendationDeps) {}

  async execute({ profileId, id, decision }: DecideRecommendationInput) {
    const { recommendations, clock, ids } = this.deps;
    const signal = await recommendations.findById(profileId, id);
    if (!signal) throw new NotFoundError('recommendation.not_found', 'Signal not found');
    if (signal.status !== 'open') {
      throw new ConflictError('recommendation.not_open', 'Signal is not open');
    }
    const today = clock.today();
    const now = clock.nowIso();
    await recommendations.decide(
      { id: ids.next(), profileId, eventId: id, decision, decidedAt: now },
      { id, statusOn: today, ...applyDecision(decision, today) },
      now,
    );
    return toList(await recommendations.list(profileId));
  }
}

export class GetRecommendationSettings {
  constructor(private readonly deps: RecommendationDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<RecommendationSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return { disabledRules: await disabledRules(this.deps, profileId) };
  }
}

export class SetRecommendationSettings {
  constructor(private readonly deps: RecommendationDeps) {}

  async execute({
    profileId,
    disabledRules: rules,
  }: RecommendationSettings & { profileId: string }): Promise<RecommendationSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const unique = [...new Set<RecommendationRuleId>(rules)];
    await this.deps.settings.set(profileId, DISABLED_RULES_KEY, unique);
    return { disabledRules: unique };
  }
}
