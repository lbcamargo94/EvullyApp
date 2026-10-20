import {
  addDays,
  formatLocalDate,
  localToday,
  useCompleteProject,
  useCreateProject,
  useProjects,
  useUpdateProject,
} from '@evully/app-core';
import type { ProjectDraft, ProjectDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog } from '@evully/ui';
import { useState } from 'react';
import { objectiveLabels } from '../tracking/messages.pt-BR';
import { projectSettingsMessages as m, settingsMessages } from './messages.pt-BR';
import { ProjectForm } from './project-form';
import { settingsError } from './settings-feedback';

const DEFAULT_PROJECT_DAYS = 62;

/** Settings › Projeto (README §8.7): one active project at a time. */
export function ProjectSection({ profileId }: { profileId: string }) {
  const { data: projects } = useProjects(profileId);
  if (!projects) return null;
  const active = projects.find((p) => p.status === 'active');
  const past = projects.filter((p) => p.status !== 'active');
  return (
    <>
      {active ? (
        <ActiveProjectCard key={active.updatedAt} profileId={profileId} project={active} />
      ) : (
        <NewProjectCard profileId={profileId} />
      )}
      <PastProjectsCard projects={past} />
    </>
  );
}

function ActiveProjectCard({ profileId, project }: { profileId: string; project: ProjectDto }) {
  const update = useUpdateProject(profileId);
  const complete = useCompleteProject(profileId);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    try {
      await complete.mutateAsync(project.id);
    } catch (e) {
      setError(settingsError(e));
    }
    setConfirming(false);
  };

  return (
    <Card aria-labelledby="project-title">
      <h2 id="project-title" className="text-lg font-semibold">
        {m.activeTitle}
      </h2>
      <ProjectForm
        initial={project}
        submitLabel={m.save}
        busy={update.isPending}
        onSubmit={(draft) => update.mutateAsync({ id: project.id, ...draft })}
      />
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          className="self-start"
          onClick={() => setConfirming(true)}
        >
          {m.complete}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.completeTitle}
        description={m.completeBody(project.name)}
        confirmLabel={m.complete}
        cancelLabel={settingsMessages.cancel}
        busy={complete.isPending}
        onConfirm={() => void finish()}
      />
    </Card>
  );
}

function NewProjectCard({ profileId }: { profileId: string }) {
  const create = useCreateProject(profileId);
  const today = localToday();
  const initial: ProjectDraft = {
    name: '',
    objective: 'fat_loss',
    startDate: today,
    targetDate: addDays(today, DEFAULT_PROJECT_DAYS),
  };
  return (
    <Card aria-labelledby="new-project-title">
      <div className="flex flex-col gap-1">
        <h2 id="new-project-title" className="text-lg font-semibold">
          {m.newTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.newHint}</p>
      </div>
      <ProjectForm
        initial={initial}
        submitLabel={m.create}
        busy={create.isPending}
        onSubmit={(draft) => create.mutateAsync(draft)}
      />
    </Card>
  );
}

function PastProjectsCard({ projects }: { projects: ProjectDto[] }) {
  return (
    <Card aria-labelledby="past-projects-title">
      <h2 id="past-projects-title" className="text-lg font-semibold">
        {m.pastTitle}
      </h2>
      {projects.length === 0 ? (
        <p className="text-sm text-text-muted">{m.noPast}</p>
      ) : (
        <ul className="flex flex-col">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-3"
            >
              <div className="flex flex-col gap-0.5">
                <strong className="font-semibold">{p.name}</strong>
                <span className="text-sm text-text-muted">
                  {objectiveLabels[p.objective].title} ·{' '}
                  {m.period(formatLocalDate(p.startDate), formatLocalDate(p.targetDate))}
                </span>
              </div>
              <span className="text-sm text-text-muted">{m.status[p.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
