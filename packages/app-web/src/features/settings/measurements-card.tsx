import { useMeasurementCatalog, useSetTrackedMeasurements } from '@evully/app-core';
import type { MeasurementTypeDto } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { measurementNames } from '../tracking/messages.pt-BR';
import { trackingSettingsMessages as m } from './messages.pt-BR';
import { useSaveFeedback } from './settings-feedback';

const nameOf = (t: MeasurementTypeDto) => measurementNames[t.code] ?? t.name;

function move(ids: string[], index: number, delta: -1 | 1): string[] {
  const next = [...ids];
  const target = index + delta;
  [next[index], next[target]] = [next[target] ?? '', next[index] ?? ''];
  return next;
}

/** Turns measurements on/off and orders them; nothing changes until "Salvar". */
export function MeasurementsCard({
  profileId,
  tracked,
}: {
  profileId: string;
  tracked: MeasurementTypeDto[];
}) {
  const { data: catalog } = useMeasurementCatalog();
  const save = useSetTrackedMeasurements(profileId);
  const feedback = useSaveFeedback();
  const initial = tracked.map((t) => t.id);
  const [selected, setSelected] = useState<string[]>(initial);
  if (!catalog) return null;

  const byId = new Map(catalog.map((t) => [t.id, t]));
  const chosen = selected.flatMap((id) => byId.get(id) ?? []);
  const others = catalog.filter((t) => !selected.includes(t.id));
  const dirty = selected.join() !== initial.join();

  const toggle = (id: string) => {
    feedback.clear();
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const reorder = (index: number, delta: -1 | 1) => {
    feedback.clear();
    setSelected((s) => move(s, index, delta));
  };

  return (
    <Card aria-labelledby="measures-title">
      <div className="flex flex-col gap-1">
        <h2 id="measures-title" className="text-lg font-semibold">
          {m.measuresTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.measuresHint}</p>
      </div>

      <fieldset className="flex flex-col gap-1">
        <legend className="pb-1 text-sm font-semibold">{m.tracked}</legend>
        {chosen.map((t, index) => (
          <div key={t.id} className="flex items-center gap-2 border-t border-border py-1.5">
            <Check type={t} checked onToggle={toggle} />
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.moveUp(nameOf(t))}
              disabled={index === 0}
              onClick={() => reorder(index, -1)}
            >
              <ChevronUp aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.moveDown(nameOf(t))}
              disabled={index === chosen.length - 1}
              onClick={() => reorder(index, 1)}
            >
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
      </fieldset>

      {others.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="pb-1 text-sm font-semibold">{m.available}</legend>
          {others.map((t) => (
            <div key={t.id} className="flex items-center border-t border-border py-1.5">
              <Check type={t} checked={false} onToggle={toggle} />
            </div>
          ))}
        </fieldset>
      )}

      {selected.length === 0 && (
        <p role="alert" className="text-sm text-danger">
          {m.pickOne}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!dirty || selected.length === 0 || save.isPending}
          onClick={() => void feedback.run(() => save.mutateAsync(selected))}
        >
          {m.saveMeasures}
        </Button>
        {feedback.node}
      </div>
    </Card>
  );
}

function Check({
  type,
  checked,
  onToggle,
}: {
  type: MeasurementTypeDto;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const id = `measure-${type.id}`;
  return (
    <label htmlFor={id} className="flex min-h-9 flex-1 items-center gap-3">
      <input
        id={id}
        type="checkbox"
        className="size-5 accent-brand"
        checked={checked}
        onChange={() => onToggle(type.id)}
      />
      {nameOf(type)}
    </label>
  );
}
