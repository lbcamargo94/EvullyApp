import {
  formatLocalDate,
  localToday,
  parseLocalDate,
  projectTimeline,
  useActiveProject,
  useCurrentProfile,
  useMeasurementSummary,
  useProfile,
  useTrackingState,
  useWeightSummary,
} from '@evully/app-core';
import type { ProjectDto } from '@evully/contracts';
import { Button, Card, ProgressBar, ScreenHeader, Skeleton } from '@evully/ui';
import { Link } from 'react-router';
import { FOCUS_FORM } from '../shared/focus-request';
import { MeasurementCards } from '../measurements/measurement-cards';
import { objectiveLabels } from '../tracking/messages.pt-BR';
import { WeightChart } from '../weights/weight-chart';
import { WeightSummaryCard } from '../weights/weight-summary-card';
import { EvolutionCard } from './evolution-card';
import { formatLongDate, shellMessages as m } from './messages.pt-BR';
import { NextWorkoutCard } from './next-workout-card';
import { TodayActivityCards } from './today-activity-cards';
import { TodayCard } from './today-card';

/**
 * Dashboard (README §8.5, DESIGN.md §7.1): indicators, the weight chart and
 * today's numbers, the next workout, the project, the last 14 days and the
 * weekly modules. Each block only for modules in use and with data.
 */
export function HomeScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  const { data: project } = useActiveProject(profileId);
  if (!profile || !profileId) return <DashboardSkeleton />;

  return (
    <>
      <ScreenHeader
        title={m.homeTitle(profile.name)}
        description={m.homeToday(formatLongDate(localToday()))}
        actions={
          <>
            <Button asChild variant="secondary">
              <Link to="/app/measurements" state={FOCUS_FORM}>
                {m.registerMeasurements}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/weight" state={FOCUS_FORM}>
                {m.registerWeight}
              </Link>
            </Button>
          </>
        }
      />
      <BodyOverview profileId={profileId} projectStart={project?.startDate ?? null} />
      <NextWorkoutCard profileId={profileId} />
      {project ? <ProjectCard project={project} /> : <NoProjectCard />}
      <EvolutionCard profileId={profileId} />
      <TodayActivityCards profileId={profileId} />
    </>
  );
}

/**
 * Weight and measurement indicators, then the weight chart beside today's
 * numbers (one column when narrow). The chart follows the weight display choice.
 */
function BodyOverview({
  profileId,
  projectStart,
}: {
  profileId: string;
  projectStart: string | null;
}) {
  const { data: tracking } = useTrackingState(profileId);
  const { data: weight } = useWeightSummary(profileId);
  const { data: measurements } = useMeasurementSummary(profileId);
  const display = tracking?.config?.weightDisplay;
  const showChart = weight && display && display !== 'hidden' && weight.series.length > 0;

  return (
    <>
      <div className="grid gap-5 empty:hidden sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {weight && display && <WeightSummaryCard summary={weight} display={display} />}
        {measurements && <MeasurementCards summary={measurements} />}
      </div>
      <div className="flex flex-wrap items-start gap-5 empty:hidden">
        {showChart && <WeightChart summary={weight} projectStart={projectStart} />}
        <TodayCard profileId={profileId} />
      </div>
    </>
  );
}

/** Placeholder in the shape of the header and indicators while the profile loads. */
function DashboardSkeleton() {
  return (
    <div role="status" aria-label={m.loading} className="flex flex-col gap-5">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

/** Without an active project the dashboard invites the user to create one (README §8.5). */
function NoProjectCard() {
  return (
    <Card aria-label={m.projectLabel}>
      <div className="flex flex-col gap-1">
        <h2 className="text-heading font-semibold">{m.noProjectTitle}</h2>
        <p className="text-sm text-text-muted">{m.noProjectBody}</p>
      </div>
      <Button asChild variant="secondary" className="self-start">
        <Link to="/app/settings?tab=project">{m.createProject}</Link>
      </Button>
    </Card>
  );
}

function ProjectCard({ project }: { project: ProjectDto }) {
  const timeline = projectTimeline(
    parseLocalDate(project.startDate),
    parseLocalDate(project.targetDate),
    localToday(),
  );
  const status =
    timeline.status === 'in_progress'
      ? m.projectDay(timeline.day, timeline.totalDays, timeline.daysLeft)
      : timeline.status === 'not_started'
        ? m.projectStartsIn(timeline.daysUntilStart)
        : m.projectEnded;

  return (
    <Card aria-label={m.projectLabel}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-caption font-semibold tracking-wider text-text-muted uppercase">
            {m.projectKicker(objectiveLabels[project.objective].title)}
          </span>
          <h2 className="text-title font-semibold tracking-tight">{project.name}</h2>
        </div>
        <span className="text-body text-text-muted">
          {status} · {m.until(formatLocalDate(project.targetDate))}
        </span>
      </div>
      {timeline.status === 'ended' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">{m.projectEndedHint}</p>
          <Button asChild variant="secondary">
            <Link to="/app/settings?tab=project">{m.completeProject}</Link>
          </Button>
        </div>
      )}
      <ProgressBar
        value={
          timeline.status === 'in_progress' ? timeline.day : timeline.status === 'ended' ? 1 : 0
        }
        max={timeline.status === 'in_progress' ? timeline.totalDays : 1}
        label={m.projectProgress}
      />
    </Card>
  );
}
