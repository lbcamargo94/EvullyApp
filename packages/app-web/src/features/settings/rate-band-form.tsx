import { useSetProjectRateBand } from '@evully/app-core';
import type { ProjectDto } from '@evully/contracts';
import { Button, Field, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { rateBandMessages as m } from './messages.pt-BR';
import { useSaveFeedback } from './settings-feedback';

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const show = (n: number | null) => (n === null ? '' : decimal.format(n).replace('-', '−'));

/** "−0,75", "-0.75" or "0,5" → number; empty → null; anything else → undefined. */
function parseSigned(text: string): number | null | undefined {
  const clean = text.trim().replace('−', '-').replace(',', '.');
  if (clean === '') return null;
  return /^-?\d+(\.\d+)?$/.test(clean) ? Number(clean) : undefined;
}

/**
 * The project's optional pace band (README §7.1): read only by the "Ritmo fora
 * da faixa" signal. The app never fills it.
 */
export function RateBandForm({ profileId, project }: { profileId: string; project: ProjectDto }) {
  const save = useSetProjectRateBand(profileId);
  const feedback = useSaveFeedback();
  const [min, setMin] = useState(show(project.weeklyRateMinKg));
  const [max, setMax] = useState(show(project.weeklyRateMaxKg));
  const [error, setError] = useState<string | null>(null);
  const hasBand = project.weeklyRateMinKg !== null;

  const submit = (band: { min: string; max: string }) => {
    const low = parseSigned(band.min);
    const high = parseSigned(band.max);
    if (low === undefined || high === undefined) return setError(m.invalid);
    if ((low === null) !== (high === null)) return setError(m.bothEnds);
    if (low !== null && high !== null && low > high) return setError(m.inverted);
    setError(null);
    void feedback.run(
      () => save.mutateAsync({ id: project.id, weeklyRateMinKg: low, weeklyRateMaxKg: high }),
      m.errors,
    );
  };

  return (
    <form
      noValidate
      aria-labelledby="rate-band-title"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        submit({ min, max });
      }}
      className="flex flex-col gap-4 border-t border-border pt-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="rate-band-title" className="text-body font-semibold">
          {m.title}
        </h3>
        <p className="text-caption text-text-muted">{m.hint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rate-band-min" label={m.min} error={undefined}>
          <Input
            id="rate-band-min"
            inputMode="decimal"
            placeholder="−0,75"
            value={min}
            onChange={(e) => setMin(e.target.value)}
          />
        </Field>
        <Field id="rate-band-max" label={m.max} error={undefined}>
          <Input
            id="rate-band-max"
            inputMode="decimal"
            placeholder="−0,25"
            value={max}
            onChange={(e) => setMax(e.target.value)}
          />
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" busy={save.isPending}>
          {m.save}
        </Button>
        {hasBand && (
          <Button
            type="button"
            variant="ghost"
            disabled={save.isPending}
            onClick={() => {
              setMin('');
              setMax('');
              submit({ min: '', max: '' });
            }}
          >
            {m.clear}
          </Button>
        )}
      </div>
      {feedback.node}
    </form>
  );
}
