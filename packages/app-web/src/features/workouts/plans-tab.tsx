import { errorCode, usePlanMutation, useWorkoutPlans } from '@evully/app-core';
import type { PlanTemplateCode, WorkoutPlanDto } from '@evully/contracts';
import { Button, Card, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { planErrorByCode, planMessages as m } from './messages.pt-BR';
import { PlanEditor } from './plan-editor';
import { PlanSuggestions } from './plan-suggestions';

/** Treinos › Planos (README §10.2): list, create, import templates, open the editor. */
export function PlansTab({ profileId }: { profileId: string }) {
  const { data: plans = [] } = useWorkoutPlans(profileId);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = plans.find((p) => p.id === openId);

  if (open) {
    return <PlanEditor profileId={profileId} plan={open} onBack={() => setOpenId(null)} />;
  }
  const active = plans.filter((p) => p.status === 'active');
  const archived = plans.filter((p) => p.status === 'archived');

  return (
    <div className="flex flex-col gap-5">
      <PlanSuggestions profileId={profileId} />
      <div className="flex flex-wrap items-start gap-4">
        <NewPlan profileId={profileId} onCreated={setOpenId} />
        <ImportTemplate profileId={profileId} onImported={setOpenId} />
      </div>
      {plans.length === 0 && <Card>{m.empty}</Card>}
      {active.length > 0 && <PlanList title={m.active} plans={active} onOpen={setOpenId} />}
      {archived.length > 0 && <PlanList title={m.archived} plans={archived} onOpen={setOpenId} />}
    </div>
  );
}

function PlanList({
  title,
  plans,
  onOpen,
}: {
  title: string;
  plans: WorkoutPlanDto[];
  onOpen: (id: string) => void;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-muted uppercase">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((p) => {
          const exercises = p.days.reduce((total, d) => total + d.exercises.length, 0);
          return (
            <button
              key={p.id}
              type="button"
              aria-label={m.open(p.name)}
              onClick={() => onOpen(p.id)}
              className="flex flex-col items-start gap-1 rounded-lg border border-border bg-surface p-5 text-left hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span className="text-lg font-semibold">{p.name}</span>
              <span className="text-sm text-text-muted">{m.summary(p.days.length, exercises)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const errorText = (e: unknown) => planErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

function NewPlan({ profileId, onCreated }: { profileId: string; onCreated: (id: string) => void }) {
  const create = usePlanMutation(profileId, (api, pid, name: string) => api.create(pid, name));
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      onCreated((await create.mutateAsync(name)).id);
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <Card aria-label={m.newPlan} className="flex-[1_1_300px] gap-3">
      <h2 className="text-base font-semibold">{m.newPlan}</h2>
      <form onSubmit={(e) => void submit(e)} className="flex gap-2">
        <Input
          aria-label={m.planName}
          placeholder={m.planName}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending}>
          {m.create}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}

function ImportTemplate({
  profileId,
  onImported,
}: {
  profileId: string;
  onImported: (id: string) => void;
}) {
  const importPlan = usePlanMutation(profileId, (api, pid, template: PlanTemplateCode) =>
    api.importTemplate(pid, template),
  );
  const [template, setTemplate] = useState<PlanTemplateCode>('cutting_2026');
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      onImported((await importPlan.mutateAsync(template)).id);
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <Card aria-label={m.importTemplate} className="flex-[1_1_300px] gap-3">
      <h2 className="text-base font-semibold">{m.importTemplate}</h2>
      <form onSubmit={(e) => void submit(e)} className="flex gap-2">
        <NativeSelect
          aria-label={m.importTemplate}
          value={template}
          onChange={(e) => setTemplate(e.target.value as PlanTemplateCode)}
        >
          {(Object.keys(m.templates) as PlanTemplateCode[]).map((t) => (
            <option key={t} value={t}>
              {m.templates[t]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary" disabled={importPlan.isPending}>
          {m.importAction}
        </Button>
      </form>
      <p className="text-sm text-text-muted">{m.importHint}</p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
