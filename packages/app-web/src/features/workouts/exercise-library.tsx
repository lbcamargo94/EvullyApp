import { foodSearchKey, useExercises } from '@evully/app-core';
import type { ExerciseDto, MuscleGroup } from '@evully/contracts';
import { Card, Input, NativeSelect } from '@evully/ui';
import { useState } from 'react';
import { ExerciseForm } from './exercise-form';
import { ExerciseRow } from './exercise-row';
import { exerciseMessages as m, muscleGroupLabels } from './messages.pt-BR';

const GROUPS = Object.keys(muscleGroupLabels) as MuscleGroup[];

/** System catalog + the profile's own exercises (README §10.1). */
export function ExerciseLibrary({ profileId }: { profileId: string }) {
  const { data: exercises = [] } = useExercises(profileId);
  const [editing, setEditing] = useState<ExerciseDto | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | ''>('');
  const q = foodSearchKey(query);
  const shown = exercises.filter(
    (e) =>
      (!group || e.muscleGroup === group) &&
      (!q || foodSearchKey(`${e.name} ${e.equipment ?? ''}`).includes(q)),
  );
  const groups = GROUPS.filter((g) => shown.some((e) => e.muscleGroup === g));

  return (
    <div className="flex flex-wrap items-start gap-6">
      <ExerciseForm
        key={editing?.id ?? 'new'}
        profileId={profileId}
        editing={editing}
        onDone={() => setEditing(null)}
      />
      <Card aria-labelledby="exercise-list-title" className="flex-[2_1_440px]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="exercise-list-title" className="text-lg font-semibold">
            {m.listTitle}
          </h2>
          <span className="text-sm text-text-muted">{m.count(exercises.length)}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
          <Input
            type="search"
            aria-label={m.search}
            placeholder={m.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <NativeSelect
            aria-label={m.group}
            value={group}
            onChange={(e) => setGroup(e.target.value as MuscleGroup | '')}
          >
            <option value="">{m.allGroups}</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {muscleGroupLabels[g]}
              </option>
            ))}
          </NativeSelect>
        </div>
        {shown.length === 0 && <p className="text-sm text-text-muted">{m.noResults}</p>}
        {groups.map((g) => (
          <section key={g} aria-label={muscleGroupLabels[g]} className="flex flex-col">
            <h3 className="pt-2 pb-1 text-sm font-semibold text-text-muted uppercase">
              {muscleGroupLabels[g]}
            </h3>
            <ul className="flex flex-col">
              {shown
                .filter((e) => e.muscleGroup === g)
                .map((e) => (
                  <ExerciseRow key={e.id} profileId={profileId} exercise={e} onEdit={setEditing} />
                ))}
            </ul>
          </section>
        ))}
      </Card>
    </div>
  );
}
