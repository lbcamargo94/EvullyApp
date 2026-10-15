import {
  formatLocalDate,
  localToday,
  parseLocalDate,
  projectTimeline,
  useActiveProject,
  useCurrentProfile,
  useProfile,
  useTrackingState,
  useWeightSummary,
} from '@evully/app-core';
import type { ProjectDto } from '@evully/contracts';
import { Button, Card, ProgressBar } from '@evully/ui';
import { Link } from 'react-router';
import { objectiveLabels } from '../tracking/messages.pt-BR';
import { WeightSummaryCard } from '../weights/weight-summary-card';
import { shellMessages as m } from './messages.pt-BR';

/** Placeholder until the V0.1 dashboard (README §8.5): project progress and what is tracked. */
export function HomeScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  const { data: project } = useActiveProject(profileId);
  const { data: tracking } = useTrackingState(profileId);
  const { data: weight } = useWeightSummary(profileId);
  if (!profile) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold tracking-tight">{m.homeTitle(profile.name)}</h1>
        <Button asChild>
          <Link to="/app/weight">{m.registerWeight}</Link>
        </Button>
      </div>
      {project ? <ProjectCard project={project} /> : <Card>{m.noProject}</Card>}
      {weight && tracking?.config && (
        <div className="grid gap-5 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
          <WeightSummaryCard summary={weight} display={tracking.config.weightDisplay} />
        </div>
      )}
      {tracking && tracking.measurementTypes.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">{m.trackedTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {tracking.measurementTypes.map((t) => (
              <li key={t.id} className="rounded-full bg-surface-muted px-3 py-1 text-sm text-text">
                {t.name}
              </li>
            ))}
          </ul>
          <p className="text-sm text-text-muted">{m.homeBody}</p>
        </Card>
      )}
    </>
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
