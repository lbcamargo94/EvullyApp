import { useSetWeightDisplay, useTrackingState } from '@evully/app-core';
import type { WeightDisplay } from '@evully/contracts';
import { Button, Card, ChoiceCard } from '@evully/ui';
import { useNavigate } from 'react-router';
import { weightDisplayLabels } from '../tracking/messages.pt-BR';
import { MeasurementsCard } from './measurements-card';
import { trackingSettingsMessages as m } from './messages.pt-BR';
import { useSaveFeedback } from './settings-feedback';
import { TagsCard } from './tags-card';

const WEIGHT_DISPLAYS = ['trend', 'daily', 'hidden'] as const;

/** Settings › Acompanhamento (README §8.7). */
export function TrackingSection({ profileId }: { profileId: string }) {
  const { data: state } = useTrackingState(profileId);
  if (!state) return null;
  const trackedKey = state.measurementTypes.map((t) => t.id).join();
  return (
    <>
      <WeightDisplayCard profileId={profileId} current={state.config?.weightDisplay ?? 'trend'} />
      {/* Remounts with fresh local state whenever the saved selection changes. */}
      <MeasurementsCard key={trackedKey} profileId={profileId} tracked={state.measurementTypes} />
      <TagsCard profileId={profileId} />
      <RedoCard />
    </>
  );
}

function WeightDisplayCard({ profileId, current }: { profileId: string; current: WeightDisplay }) {
  const setDisplay = useSetWeightDisplay(profileId);
  const feedback = useSaveFeedback();
  const choose = (value: WeightDisplay) => {
    if (value !== current) void feedback.run(() => setDisplay.mutateAsync(value));
  };
  return (
    <Card aria-labelledby="weight-display-title">
      <div className="flex flex-col gap-1">
        <h2 id="weight-display-title" className="text-lg font-semibold">
          {m.weightTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.weightHint}</p>
      </div>
      <div role="radiogroup" aria-labelledby="weight-display-title" className="grid gap-3">
        {WEIGHT_DISPLAYS.map((value) => (
          <ChoiceCard
            key={value}
            checked={value === current}
            disabled={setDisplay.isPending}
            title={weightDisplayLabels[value].title}
            description={weightDisplayLabels[value].description}
            onClick={() => choose(value)}
          />
        ))}
      </div>
      {feedback.node}
    </Card>
  );
}

function RedoCard() {
  const navigate = useNavigate();
  return (
    <Card aria-labelledby="redo-title">
      <div className="flex flex-col gap-1">
        <h2 id="redo-title" className="text-lg font-semibold">
          {m.redoTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.redoHint}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="self-start"
        onClick={() => void navigate('/onboarding?redo=1')}
      >
        {m.redo}
      </Button>
    </Card>
  );
}
