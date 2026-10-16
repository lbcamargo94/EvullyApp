import {
  useActiveProject,
  useCurrentProfile,
  useWeightSummary,
  useWeights,
} from '@evully/app-core';
import type { WeightEntry } from '@evully/contracts';
import { useState } from 'react';
import { ImportHeader } from '../imports/import-header';
import { weightMessages as m } from './messages.pt-BR';
import { WeightChart } from './weight-chart';
import { WeightForm } from './weight-form';
import { WeightHistory } from './weight-history';

export function WeightScreen() {
  const { profileId } = useCurrentProfile();
  const { data: entries = [] } = useWeights(profileId);
  const { data: summary } = useWeightSummary(profileId);
  const { data: project } = useActiveProject(profileId);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  if (!profileId) return null;

  return (
    <>
      <ImportHeader title={m.title} kind="weights" />
      <div className="flex flex-wrap items-start gap-6">
        <WeightForm
          key={editing?.id ?? 'new'}
          profileId={profileId}
          editing={editing}
          onDone={() => setEditing(null)}
        />
        {summary && <WeightChart summary={summary} projectStart={project?.startDate ?? null} />}
      </div>
      <WeightHistory profileId={profileId} entries={entries} onEdit={setEditing} />
    </>
  );
}
