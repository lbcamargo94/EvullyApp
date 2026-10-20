import { errorCode, projectLength } from '@evully/app-core';
import { projectDraftSchema, type Objective, type ProjectDraft } from '@evully/contracts';
import { Button, ChoiceCard, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import {
  objectiveLabels,
  projectErrorByCode,
  trackingMessages as t,
} from '../tracking/messages.pt-BR';
import { projectSettingsMessages as m, settingsMessages } from './messages.pt-BR';
import { settingsError } from './settings-feedback';

type Errors = { name?: string | undefined; dates?: string | undefined; form?: string | undefined };

const OBJECTIVES = Object.keys(objectiveLabels) as Objective[];

function validate(draft: ProjectDraft): Errors | null {
  const parsed = projectDraftSchema.safeParse(draft);
  if (parsed.success) return null;
  const nameIssue = parsed.error.issues.find((i) => i.path[0] === 'name');
  const dateIssue = parsed.error.issues.some((i) => i.path[0] !== 'name');
  return {
    name: nameIssue?.message,
    dates: dateIssue ? projectErrorByCode['date.invalid']?.message : undefined,
  };
}

function serverErrors(error: unknown): Errors {
  const known = projectErrorByCode[errorCode(error) ?? ''];
  return known ? { [known.field]: known.message } : { form: settingsError(error) };
}

/** Name, objective and dates of a project; shared by "edit active" and "new project". */
export function ProjectForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial: ProjectDraft;
  submitLabel: string;
  busy: boolean;
  onSubmit: (draft: ProjectDraft) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<ProjectDraft>({
    name: initial.name,
    objective: initial.objective,
    startDate: initial.startDate,
    targetDate: initial.targetDate,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const days = projectLength(draft.startDate, draft.targetDate);

  const change = (patch: Partial<ProjectDraft>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validate(draft);
    setErrors(invalid ?? {});
    if (invalid) return;
    try {
      await onSubmit(draft);
      setSaved(true);
    } catch (error) {
      setErrors(serverErrors(error));
    }
  };

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      <Field id="settings-project-name" label={t.projectName} error={errors.name}>
        <Input
          id="settings-project-name"
          placeholder={t.projectNamePlaceholder}
          maxLength={60}
          value={draft.name}
          aria-invalid={!!errors.name}
          onChange={(e) => change({ name: e.target.value })}
        />
      </Field>
      <div className="flex flex-col gap-2">
        <span id="settings-project-objective" className="text-sm font-semibold">
          {m.objective}
        </span>
        <div
          role="radiogroup"
          aria-labelledby="settings-project-objective"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {OBJECTIVES.map((o) => (
            <ChoiceCard
              key={o}
              checked={draft.objective === o}
              title={objectiveLabels[o].title}
              description={objectiveLabels[o].description}
              onClick={() => change({ objective: o })}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="settings-project-start" label={t.startDate}>
          <Input
            id="settings-project-start"
            type="date"
            value={draft.startDate}
            aria-invalid={!!errors.dates}
            onChange={(e) => change({ startDate: e.target.value })}
          />
        </Field>
        <Field id="settings-project-target" label={t.targetDate} error={errors.dates}>
          <Input
            id="settings-project-target"
            type="date"
            value={draft.targetDate}
            aria-invalid={!!errors.dates}
            onChange={(e) => change({ targetDate: e.target.value })}
          />
        </Field>
      </div>
      {days !== null && days > 0 && (
        <p className="text-sm text-text-muted">{t.projectDays(days)}</p>
      )}
      {errors.form && (
        <p role="alert" className="text-sm text-danger">
          {errors.form}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" className="self-start" disabled={busy}>
          {busy ? m.saving : submitLabel}
        </Button>
        {saved && (
          <p role="status" className="text-sm text-text-muted">
            {settingsMessages.saved}
          </p>
        )}
      </div>
    </form>
  );
}
