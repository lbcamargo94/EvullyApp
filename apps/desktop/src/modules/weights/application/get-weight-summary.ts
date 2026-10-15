import type { WeightSummary } from '@evully/contracts';
import { weightStats } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { ProjectRepository } from '../../tracking/ports/project-repository';
import type { WeightRepository } from '../ports/weight-repository';

/** Current weight, trend, start and changes, all computed by packages/domain (README §7.2). */
export class GetWeightSummary {
  constructor(
    private readonly weights: WeightRepository,
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId }: { profileId: string }): Promise<WeightSummary> {
    const [entries, project] = await Promise.all([
      this.weights.listByProfile(profileId),
      this.projects.findActive(profileId),
    ]);
    const stats = weightStats(
      entries.map((e) => ({
        measuredOn: e.measuredOn,
        measuredAt: e.measuredAt,
        weightKg: e.weightKg,
        tagged: e.tags.length > 0,
      })),
      this.clock.today(),
      project?.startDate ?? null,
    );
    const dated = (d: { date: string; weightKg: number } | null) =>
      d && { date: d.date, weightKg: d.weightKg };
    return {
      objective: project?.objective ?? null,
      current: dated(stats.current),
      trend: stats.trend,
      start: dated(stats.start),
      change: stats.change,
      trendChange: stats.trendChange,
      series: stats.series.map(({ date, weightKg, trend, tagged }) => ({
        date,
        weightKg,
        trend,
        tagged,
      })),
    };
  }
}
