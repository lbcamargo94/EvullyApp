import { addDays, buildTrackingProposal, localToday, projectLength } from '@evully/app-core';
import {
  projectDraftSchema,
  type FocusArea,
  type Objective,
  type ProfileDto,
  type ProjectDto,
  type ProjectDraft,
  type TrackingAnswers,
} from '@evully/contracts';
import { useState } from 'react';
import { measurementNames, projectErrorByCode } from './messages.pt-BR';

/** Steps 2–7 of README §8.2.1, then the summary. Step 1 is the profile form. */
export const STEPS = [
  'objective',
  'project',
  'focus',
  'weight',
  'interests',
  'suggestion',
  'summary',
] as const;
export type Step = (typeof STEPS)[number];

const DEFAULT_PROJECT_DAYS = 62;

export type ProjectErrors = { name?: string | undefined; dates?: string | undefined };

/**
 * State and navigation of the tracking questionnaire, kept out of the screen.
 * With an active project (redoing it from Settings) the project steps are
 * skipped and the project is kept as is.
 */
export function useQuestionnaire(profile: ProfileDto, activeProject: ProjectDto | null = null) {
  const today = localToday();
  const firstStep: Step = activeProject ? 'focus' : 'objective';
  const [step, setStep] = useState<Step>(firstStep);
  const [objective, setObjective] = useState<Objective | null>(activeProject?.objective ?? null);
  const [hasProject, setHasProject] = useState(!activeProject);
  const [project, setProject] = useState<Omit<ProjectDraft, 'objective'>>({
    name: '',
    startDate: today,
    targetDate: addDays(today, DEFAULT_PROJECT_DAYS),
  });
  const [projectErrors, setProjectErrors] = useState<ProjectErrors>({});
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(['waist']);
  const [weightDisplay, setWeightDisplay] = useState<TrackingAnswers['weightDisplay']>('trend');
  const [interests, setInterests] = useState<TrackingAnswers['interests']>({
    menstrualCycle: null,
    progressPhotos: null,
    pin: null,
    weighingDevice: null,
  });
  const [suggestion, setSuggestion] = useState('');

  const index = STEPS.indexOf(step);
  const projectDraft: ProjectDraft | null =
    hasProject && objective ? { ...project, objective } : null;
  const shownProject: ProjectDraft | null = projectDraft ?? activeProject;
  const proposal = buildTrackingProposal(
    { objective: shownProject?.objective ?? null, focusAreas, weightDisplay },
    profile.sex,
  );

  const goTo = (target: Step) => setStep(target);
  const goForward = () => setStep(STEPS[index + 1] ?? 'summary');

  const skipProject = () => {
    setHasProject(false);
    setObjective(null);
    setStep('focus');
  };

  const validateProject = (): boolean => {
    const parsed = projectDraftSchema.safeParse({ ...project, objective });
    if (parsed.success) {
      setProjectErrors({});
      return true;
    }
    const nameIssue = parsed.error.issues.find((i) => i.path[0] === 'name');
    const dateIssue = parsed.error.issues.some((i) => i.path[0] !== 'name');
    setProjectErrors({
      name: nameIssue?.message,
      dates: dateIssue ? projectErrorByCode['date.invalid']?.message : undefined,
    });
    return false;
  };

  const next = () => {
    if (step === 'objective') {
      if (!objective) return skipProject();
      setHasProject(true);
    }
    if (step === 'project' && !validateProject()) return;
    goForward();
  };

  const back = () => {
    if (step === firstStep) return;
    if (step === 'focus' && !hasProject) return setStep('objective');
    setStep(STEPS[Math.max(0, index - 1)] ?? 'objective');
  };

  /** Server-side project errors send the user back to the project step. */
  const showProjectError = (field: keyof ProjectErrors, message: string) => {
    setProjectErrors({ [field]: message });
    setStep('project');
  };

  const answers = (): TrackingAnswers => ({
    project: projectDraft,
    focusAreas: proposal.focusAreas,
    weightDisplay,
    interests,
    suggestion: suggestion.trim() || null,
  });

  const measurementsFor = (area: FocusArea) =>
    buildTrackingProposal({ objective, focusAreas: [area], weightDisplay }, null)
      .measurementCodes.map((code) => measurementNames[code] ?? code)
      .join(', ');

  const toggleFocus = (area: FocusArea) =>
    setFocusAreas((current) =>
      current.includes(area) ? current.filter((a) => a !== area) : [...current, area],
    );

  return {
    step,
    index,
    firstStep,
    keepsActiveProject: activeProject !== null,
    isProjectStep: step === 'objective' || step === 'project',
    objective,
    setObjective,
    project,
    setProject,
    projectErrors,
    totalDays: projectLength(project.startDate, project.targetDate),
    projectDraft,
    shownProject,
    focusAreas,
    toggleFocus,
    measurementsFor,
    weightDisplay,
    setWeightDisplay,
    interests,
    setInterests,
    suggestion,
    setSuggestion,
    proposal,
    next,
    back,
    goTo,
    goForward,
    skipProject,
    showProjectError,
    answers,
  };
}

export type QuestionnaireState = ReturnType<typeof useQuestionnaire>;
