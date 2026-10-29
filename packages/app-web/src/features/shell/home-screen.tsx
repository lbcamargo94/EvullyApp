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
import { Button, Card, ProgressBar } from '@evully/ui';
import { Link } from 'react-router';
import { MeasurementCards } from '../measurements/measurement-cards';
import { objectiveLabels } from '../tracking/messages.pt-BR';
import { WeightSummaryCard } from '../weights/weight-summary-card';
import { shellMessages as m } from './messages.pt-BR';
import { TodayActivityCards } from './today-activity-cards';
import { TodayCard } from './today-card';

/**
 * Dashboard (README §8.5): project progress, weight as chosen, up to 3 measurements,
 * and today's nutrition, habits, cardio and sleep for the modules in use.
 */
export function HomeScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  const { data: project } = useActiveProject(profileId);
  const { data: tracking } = useTrackingState(profileId);
  const { data: weight } = useWeightSummary(profileId);
  const { data: measurements } = useMeasurementSummary(profileId);
  if (!profile) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold tracking-tight">{m.homeTitle(profile.name)}</h1>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/app/measurements">{m.registerMeasurements}</Link>
          </Button>
          <Button asChild>
            <Link to="/app/weight">{m.registerWeight}</Link>
          </Button>
        </div>
      </div>
      {project ? <ProjectCard project={project} /> : <NoProjectCard />}
      <div className="grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {weight && tracking?.config && (
          <WeightSummaryCard summary={weight} display={tracking.config.weightDisplay} />
        )}
        {measurements && <MeasurementCards summary={measurements} />}
      </div>
      {profileId && <TodayCard profileId={profileId} />}
      {profileId && <TodayActivityCards profileId={profileId} />}
    </>
  );
}

/** Without an active project the dashboard invites the user to create one (README §8.5). */
function NoProjectCard() {
  return (
    <Card aria-label={m.projectLabel}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{m.noProjectTitle}</h2>
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
          <span className="text-[13px] font-semibold tracking-wider text-text-muted uppercase">
            {m.projectKicker(objectiveLabels[project.objective].title)}
          </span>
          <h2 className="text-[26px] font-semibold tracking-tight">{project.name}</h2>
        </div>
        <span className="text-[15px] text-text-muted">
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
