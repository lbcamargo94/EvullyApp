import { errorCode, parseDecimal, useAddWater, useRemoveWater } from '@evully/app-core';
import type { NutritionDay } from '@evully/contracts';
import { Button, Card, Input, ProgressBar } from '@evully/ui';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { dietMessages as m, foodLogErrorByCode, formatNumber } from './messages.pt-BR';

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Quick water logging for the day, against the target when there is one (README §9.4.1). */
export function WaterCard({
  profileId,
  day,
  canLog,
}: {
  profileId: string;
  day: NutritionDay;
  canLog: boolean;
}) {
  const add = useAddWater(profileId);
  const remove = useRemoveWater(profileId);
  const [other, setOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const target = day.target?.waterMl ?? null;
  const total = day.water.totalMl;

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
    } catch (e) {
      setError(foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };
  const addMl = (amountMl: number) => run(() => add.mutateAsync({ date: day.date, amountMl }));
  const submitOther = (e: FormEvent) => {
    e.preventDefault();
    const ml = parseDecimal(other);
    if (ml === null) return;
    void addMl(ml).then(() => setOther(''));
  };

  return (
    <Card aria-labelledby="water-title" className="gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="water-title" className="text-base font-semibold">
          {m.waterTitle}
        </h3>
        <span className="font-semibold tabular-nums">
          {target
            ? m.ofTarget(formatNumber(total), formatNumber(target), 'ml')
            : m.waterTotal(formatNumber(total))}
        </span>
      </div>
      {target !== null && target > 0 && (
        <ProgressBar value={total} max={target} label={m.progressOf(m.waterTitle)} />
      )}
      {canLog ? (
        <form onSubmit={submitOther} className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={add.isPending}
            onClick={() => void addMl(250)}
          >
            {m.waterGlass}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={add.isPending}
            onClick={() => void addMl(500)}
          >
            {m.waterBottle}
          </Button>
          <Input
            inputMode="numeric"
            aria-label={m.waterOther}
            placeholder="ml"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="min-h-10 w-24"
          />
          <Button type="submit" variant="ghost" disabled={add.isPending}>
            {m.waterAdd}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-text-muted">{m.waterFuture}</p>
      )}
      {day.water.logs.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {day.water.logs.map((w) => {
            const ml = formatNumber(w.amountMl);
            const at = time.format(new Date(w.loggedAt));
            return (
              <li
                key={w.id}
                className="flex items-center gap-1 rounded-full bg-surface-muted py-1 pr-1 pl-3 text-sm tabular-nums"
              >
                {m.waterEntry(ml, at)}
                <button
                  type="button"
                  aria-label={m.waterRemove(ml, at)}
                  disabled={remove.isPending}
                  onClick={() => void run(() => remove.mutateAsync(w.id))}
                  className="rounded-full p-1 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </Card>
  );
}
