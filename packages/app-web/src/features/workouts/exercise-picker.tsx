import { foodSearchKey, useExercises } from '@evully/app-core';
import type { ExerciseDto } from '@evully/contracts';
import { Button, Input } from '@evully/ui';
import { useState } from 'react';
import { muscleGroupLabels, planMessages as m } from './messages.pt-BR';

const MAX_RESULTS = 8;

/** Searchable list of the library (system + own exercises). */
export function ExercisePicker({
  profileId,
  onPick,
  onCancel,
}: {
  profileId: string;
  onPick: (exercise: ExerciseDto) => void;
  onCancel: () => void;
}) {
  const { data: exercises = [] } = useExercises(profileId);
  const [query, setQuery] = useState('');
  const q = foodSearchKey(query);
  const matches = exercises
    .filter((e) => !q || foodSearchKey(`${e.name} ${muscleGroupLabels[e.muscleGroup]}`).includes(q))
    .slice(0, MAX_RESULTS);

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-muted p-3">
      <Input
        autoFocus
        type="search"
        aria-label={m.searchExercise}
        placeholder={m.searchExercise}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
      />
      {matches.length === 0 && <p className="text-sm text-text-muted">{m.noMatch}</p>}
      <ul className="flex flex-col">
        {matches.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onPick(e)}
              className="flex w-full justify-between gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span>{e.name}</span>
              <span className="text-sm text-text-muted">{muscleGroupLabels[e.muscleGroup]}</span>
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" className="self-start" onClick={onCancel}>
        {m.cancel}
      </Button>
    </div>
  );
}
