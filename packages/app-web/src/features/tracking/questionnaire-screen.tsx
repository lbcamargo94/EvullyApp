import {
  errorCode,
  useAcceptTracking,
  useActiveProject,
  useCurrentProfile,
  useProfile,
  useSkipTracking,
} from '@evully/app-core';
import type { ProfileDto, ProjectDto } from '@evully/contracts';
import { Button, Card, ProgressBar } from '@evully/ui';
import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Logo } from '../shell/logo';
import { projectErrorByCode, trackingMessages as m } from './messages.pt-BR';
import {
  FocusStep,
  InterestsStep,
  ObjectiveStep,
  ProjectStep,
  SuggestionStep,
  SummaryStep,
  WeightStep,
} from './questionnaire-steps';
import { STEPS, useQuestionnaire, type QuestionnaireState } from './use-questionnaire';

const LAST_NUMBERED_STEP = 7;

/** `?redo=1` comes from Settings: leaving does not record a skip and returns there. */
export function QuestionnaireScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  const active = useActiveProject(profileId);
  const [params] = useSearchParams();
  if (!profileId) return <Navigate to="/profiles" replace />;
  if (!profile || active.isPending) return null;
  return (
    <Questionnaire
      profile={profile}
      activeProject={active.data ?? null}
      redo={params.get('redo') === '1'}
    />
  );
}

function Questionnaire({
  profile,
  activeProject,
  redo,
}: {
  profile: ProfileDto;
  activeProject: ProjectDto | null;
  redo: boolean;
}) {
  const navigate = useNavigate();
  const q = useQuestionnaire(profile, activeProject);
  const accept = useAcceptTracking(profile.id);
  const skip = useSkipTracking(profile.id);
  const [saveError, setSaveError] = useState<string | null>(null);
  const busy = accept.isPending || skip.isPending;
  const finish = () => void navigate(redo ? '/app/settings' : '/app', { replace: true });

  const submit = async () => {
    setSaveError(null);
    try {
      await accept.mutateAsync(q.answers());
      finish();
    } catch (error) {
      const known = projectErrorByCode[errorCode(error) ?? ''];
      if (known) q.showProjectError(known.field, known.message);
      else setSaveError(m.genericError);
    }
  };

  const skipAll = async () => {
    if (!redo) await skip.mutateAsync(undefined);
    finish();
  };

  const isSummary = q.step === 'summary';

  return (
    <main className="flex min-h-screen justify-center bg-background px-4 py-10 text-text">
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <span className="text-sm text-text-muted">
            {isSummary ? m.summaryStep : m.step(q.index + 2, LAST_NUMBERED_STEP)}
          </span>
        </div>
        <ProgressBar value={q.index + 1} max={STEPS.length} label={m.progress} />

        <Card className="gap-6 p-8">
          <StepBody q={q} sex={profile.sex} />
          {saveError && (
            <p role="alert" className="text-sm text-danger">
              {saveError}
            </p>
          )}
          <Footer q={q} busy={busy} onAccept={() => void submit()} />
        </Card>

        <button
          type="button"
          onClick={() => void skipAll()}
          disabled={busy}
          className="self-center text-sm text-text-muted underline-offset-4 hover:text-text hover:underline"
        >
          {redo ? m.cancelRedo : m.skipAll}
        </button>
      </div>
    </main>
  );
}

function StepBody({ q, sex }: { q: QuestionnaireState; sex: ProfileDto['sex'] }) {
  switch (q.step) {
    case 'objective':
      return <ObjectiveStep value={q.objective} onChange={q.setObjective} />;
    case 'project':
      return (
        <ProjectStep
          value={q.project}
          totalDays={q.totalDays}
          errors={q.projectErrors}
          onChange={q.setProject}
        />
      );
    case 'focus':
      return (
        <FocusStep
          value={q.focusAreas}
          measurementsFor={q.measurementsFor}
          onToggle={q.toggleFocus}
        />
      );
    case 'weight':
      return <WeightStep value={q.weightDisplay} onChange={q.setWeightDisplay} />;
    case 'interests':
      return <InterestsStep sex={sex} value={q.interests} onChange={q.setInterests} />;
    case 'suggestion':
      return <SuggestionStep value={q.suggestion} onChange={q.setSuggestion} />;
    case 'summary':
      return (
        <SummaryStep
          objective={q.shownProject?.objective ?? null}
          project={q.shownProject}
          proposal={q.proposal}
        />
      );
  }
}

function Footer({
  q,
  busy,
  onAccept,
}: {
  q: QuestionnaireState;
  busy: boolean;
  onAccept: () => void;
}) {
  const isSummary = q.step === 'summary';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <Button
        type="button"
        variant="ghost"
        onClick={q.back}
        disabled={q.step === q.firstStep || busy}
      >
        {m.back}
      </Button>
      <div className="flex flex-wrap gap-3">
        {isSummary ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => q.goTo(q.firstStep)}
              disabled={busy}
            >
              {m.adjust}
            </Button>
            <Button type="button" onClick={onAccept} disabled={busy}>
              {busy ? m.saving : m.accept}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={q.isProjectStep ? q.skipProject : q.goForward}
            >
              {q.isProjectStep ? m.skipProject : m.skip}
            </Button>
            <Button type="button" onClick={q.next}>
              {q.step === 'suggestion' ? m.toSummary : m.next}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
