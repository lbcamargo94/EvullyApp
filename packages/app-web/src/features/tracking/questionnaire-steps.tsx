import { asksAboutMenstrualCycle, formatLocalDate, type TrackingProposal } from '@evully/app-core';
import type {
  FocusArea,
  Objective,
  ProfileDto,
  ProjectDraft,
  TrackingAnswers,
  WeightDisplay,
} from '@evully/contracts';
import { ChoiceCard, Field, Input } from '@evully/ui';
import type { ReactNode } from 'react';
import {
  focusAreaLabels,
  interestQuestions,
  measurementNames,
  objectiveLabels,
  trackingMessages as m,
  weightDisplayLabels,
} from './messages.pt-BR';

export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="text-text-muted">{subtitle}</p>}
    </div>
  );
}

function Grid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {children}
    </div>
  );
}

export function ObjectiveStep(props: {
  value: Objective | null;
  onChange: (o: Objective) => void;
}) {
  return (
    <>
      <StepHeading title={m.objectiveTitle} />
      <div role="radiogroup" aria-label={m.objectiveTitle} className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(objectiveLabels) as Objective[]).map((o) => (
          <ChoiceCard
            key={o}
            checked={props.value === o}
            title={objectiveLabels[o].title}
            description={objectiveLabels[o].description}
            onClick={() => props.onChange(o)}
          />
        ))}
      </div>
    </>
  );
}

export function ProjectStep(props: {
  value: Omit<ProjectDraft, 'objective'>;
  totalDays: number | null;
  errors: { name?: string | undefined; dates?: string | undefined };
  onChange: (v: Omit<ProjectDraft, 'objective'>) => void;
}) {
  const { value, errors } = props;
  return (
    <>
      <StepHeading title={m.projectTitle} subtitle={m.projectSubtitle} />
      <Field id="project-name" label={m.projectName} error={errors.name}>
        <Input
          id="project-name"
          autoFocus
          placeholder={m.projectNamePlaceholder}
          value={value.name}
          aria-invalid={!!errors.name}
          onChange={(e) => props.onChange({ ...value, name: e.target.value })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="project-start" label={m.startDate}>
          <Input
            id="project-start"
            type="date"
            value={value.startDate}
            aria-invalid={!!errors.dates}
            onChange={(e) => props.onChange({ ...value, startDate: e.target.value })}
          />
        </Field>
        <Field id="project-target" label={m.targetDate} error={errors.dates}>
          <Input
            id="project-target"
            type="date"
            value={value.targetDate}
            aria-invalid={!!errors.dates}
            onChange={(e) => props.onChange({ ...value, targetDate: e.target.value })}
          />
        </Field>
      </div>
      {props.totalDays !== null && props.totalDays > 0 && (
        <p className="text-sm text-text-muted">{m.projectDays(props.totalDays)}</p>
      )}
    </>
  );
}

export function FocusStep(props: {
  value: FocusArea[];
  measurementsFor: (area: FocusArea) => string;
  onToggle: (area: FocusArea) => void;
}) {
  return (
    <>
      <StepHeading title={m.focusTitle} subtitle={m.focusSubtitle} />
      <Grid label={m.focusTitle}>
        {(Object.keys(focusAreaLabels) as FocusArea[]).map((area) => (
          <ChoiceCard
            key={area}
            multiple
            checked={props.value.includes(area)}
            title={focusAreaLabels[area]}
            description={props.measurementsFor(area)}
            onClick={() => props.onToggle(area)}
          />
        ))}
      </Grid>
    </>
  );
}

export function WeightStep(props: { value: WeightDisplay; onChange: (v: WeightDisplay) => void }) {
  return (
    <>
      <StepHeading title={m.weightTitle} subtitle={m.weightSubtitle} />
      <div role="radiogroup" aria-label={m.weightTitle} className="flex flex-col gap-3">
        {(Object.keys(weightDisplayLabels) as WeightDisplay[]).map((d) => (
          <ChoiceCard
            key={d}
            checked={props.value === d}
            title={weightDisplayLabels[d].title}
            description={weightDisplayLabels[d].description}
            onClick={() => props.onChange(d)}
          />
        ))}
      </div>
    </>
  );
}

type Interests = TrackingAnswers['interests'];

export function InterestsStep(props: {
  sex: ProfileDto['sex'];
  value: Interests;
  onChange: (v: Interests) => void;
}) {
  const keys = (Object.keys(interestQuestions) as (keyof Interests)[]).filter(
    (k) => k !== 'menstrualCycle' || asksAboutMenstrualCycle(props.sex),
  );
  return (
    <>
      <StepHeading title={m.interestsTitle} subtitle={m.interestsSubtitle} />
      <div className="flex flex-col divide-y divide-border">
        {keys.map((key) => {
          const { question, options } = interestQuestions[key];
          return (
            <div key={key} className="flex flex-col gap-2.5 py-4">
              <span id={`q-${key}`} className="font-medium">
                {question}
              </span>
              <div role="radiogroup" aria-labelledby={`q-${key}`} className="flex flex-wrap gap-2">
                {Object.entries(options).map(([option, label]) => {
                  const checked = props.value[key] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => props.onChange({ ...props.value, [key]: option })}
                      className={
                        checked
                          ? 'min-h-9 rounded-full border-2 border-brand bg-brand-soft px-3.5 text-sm font-semibold text-brand-soft-foreground'
                          : 'min-h-9 rounded-full border border-border bg-surface px-3.5 text-sm text-text hover:border-brand/60'
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function SuggestionStep(props: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <StepHeading title={m.suggestionTitle} />
      <Field id="suggestion" label={m.suggestionLabel} hint={m.optional}>
        <textarea
          id="suggestion"
          rows={5}
          maxLength={500}
          value={props.value}
          placeholder={m.suggestionPlaceholder}
          onChange={(e) => props.onChange(e.target.value)}
          className="resize-y rounded-sm border border-border bg-surface p-3 text-[15px] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-brand"
        />
      </Field>
    </>
  );
}

export function SummaryStep(props: {
  objective: Objective | null;
  project: ProjectDraft | null;
  proposal: TrackingProposal;
}) {
  const rows: [string, string][] = [
    [m.summaryObjective, props.objective ? objectiveLabels[props.objective].title : '—'],
    [
      m.summaryProject,
      props.project
        ? m.summaryUntil(props.project.name, formatLocalDate(props.project.targetDate))
        : m.summaryNoProject,
    ],
    [
      m.summaryMeasures,
      props.proposal.measurementCodes.map((c) => measurementNames[c] ?? c).join(' · '),
    ],
    [
      m.summaryWeight,
      weightDisplayLabels[props.proposal.weightDisplay].title.replace(' (recomendado)', ''),
    ],
  ];
  return (
    <>
      <StepHeading title={m.summaryTitle} />
      <dl className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 px-4 py-3.5">
            <dt className="text-text-muted">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-text-muted">{m.summaryFooter}</p>
    </>
  );
}
