import {
  useCurrentProfile,
  useMeasurementSummary,
  useMeasurements,
  useTrackingState,
} from '@evully/app-core';
import type { MeasurementSession } from '@evully/contracts';
import { Card } from '@evully/ui';
import { useState } from 'react';
import { MeasurementChart } from './measurement-chart';
import { MeasurementForm } from './measurement-form';
import { MeasurementHistory } from './measurement-history';
import { measurementMessages as m } from './messages.pt-BR';

export function MeasurementScreen() {
  const { profileId } = useCurrentProfile();
  const { data: tracking } = useTrackingState(profileId);
  const { data: sessions = [] } = useMeasurements(profileId);
  const { data: summary } = useMeasurementSummary(profileId);
  const [editing, setEditing] = useState<MeasurementSession | null>(null);
  if (!profileId || !tracking) return null;
  const types = tracking.measurementTypes;

  return (
    <>
      <h1 className="text-[26px] font-semibold">{m.title}</h1>
      {types.length === 0 ? (
        <Card>{m.noTracked}</Card>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-6">
            <MeasurementForm
              key={editing?.id ?? 'new'}
              profileId={profileId}
              types={types}
              editing={editing}
              onDone={() => setEditing(null)}
            />
            {summary && <MeasurementChart summary={summary} />}
          </div>
          <MeasurementHistory
            profileId={profileId}
            types={types}
            sessions={sessions}
            onEdit={setEditing}
          />
        </>
      )}
    </>
  );
}
