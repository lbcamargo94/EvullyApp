import {
  errorCode,
  parseDecimal,
  useExerciseHistory,
  useSetExerciseIncrement,
} from '@evully/app-core';
import type { ExerciseHistoryDto } from '@evully/contracts';
import { Button, EmptyState, Input } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatKgValue, formatShortDate, historyMessages as m } from './messages.pt-BR';

/** History of one exercise (README §10.5): recorded values, no estimates. */
export function ExerciseHistoryPanel({
  profileId,
  exerciseId,
}: {
  profileId: string;
  exerciseId: string;
}) {
  const { data: history } = useExerciseHistory(profileId, exerciseId);
  if (!history) return null;
  const last = history.sessions[0];

  return (
    <section
      aria-label={m.title}
      className="ml-6 flex flex-col gap-4 rounded-md bg-surface-muted p-4"
    >
      {history.sessions.length === 0 ? (
        <EmptyState>{m.empty}</EmptyState>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-4">
            <Stat label={m.lastSession} value={last ? formatShortDate(last.startedAt) : '—'} />
            <Stat
              label={m.bestLoad}
              value={history.bestLoad ? m.kg(formatKgValue(history.bestLoad.weightKg)) : '—'}
              hint={history.bestLoad ? m.on(history.bestLoad.startedAt) : undefined}
            />
            <Stat
              label={m.bestSet}
              value={
                history.bestSet
                  ? m.setValue(formatKgValue(history.bestSet.weightKg), history.bestSet.repetitions)
                  : '—'
              }
              hint={history.bestSet ? m.on(history.bestSet.startedAt) : undefined}
            />
            <Stat label={m.recent} value={m.recentValue(history.recentSessions)} />
          </dl>
          <LoadChart history={history} />
          <SessionList history={history} />
        </>
      )}
      <IncrementForm profileId={profileId} exerciseId={exerciseId} history={history} />
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-text-muted">{hint}</dd>}
    </div>
  );
}

/** Text alternative with the first and last top loads (DESIGN.md §7). */
function loadChartAlt(data: { date: string; load: number | null }[]): string {
  const point = (p: (typeof data)[number] | undefined) =>
    p ? `${m.kg(formatKgValue(p.load ?? 0))} (${formatShortDate(p.date)})` : '';
  return m.chartAlt(data.length, point(data[0]), point(data.at(-1)));
}

function LoadChart({ history }: { history: ExerciseHistoryDto }) {
  const data = history.sessions
    .filter((s) => s.topWeightKg !== null)
    .map((s) => ({ date: s.startedAt, load: s.topWeightKg }))
    .reverse();
  if (data.length < 2) return null;
  return (
    <figure className="m-0 flex flex-col gap-1">
      <figcaption className="text-sm font-semibold">{m.chartTitle}</figcaption>
      <div role="img" aria-label={loadChartAlt(data)} className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatShortDate}
              stroke="var(--color-text-muted)"
              fontSize={12}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={['dataMin - 2.5', 'dataMax + 2.5']}
              tickFormatter={(v: number) => Math.round(v).toString()}
              stroke="var(--color-text-muted)"
              fontSize={12}
              tickLine={false}
              width={36}
            />
            <Tooltip
              formatter={(value) => [m.kg(formatKgValue(Number(value))), m.bestLoad]}
              labelFormatter={(date) => formatShortDate(String(date))}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
              }}
            />
            <Line
              dataKey="load"
              stroke="var(--color-brand)"
              strokeWidth={3}
              dot={{ r: 3, fill: 'var(--color-brand)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function SessionList({ history }: { history: ExerciseHistoryDto }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-semibold">{m.sessions}</h4>
      <ul className="flex flex-col text-sm">
        {history.sessions.map((s) => (
          <li
            key={s.sessionId}
            className="flex flex-wrap gap-x-3 border-t border-border py-1.5 tabular-nums"
          >
            <span className="w-14 text-text-muted">{formatShortDate(s.startedAt)}</span>
            <span className="flex-1">
              {s.sets
                .map((set) =>
                  set.weightKg === null
                    ? `${set.repetitions ?? set.durationSeconds ?? ''}${set.durationSeconds !== null ? ' s' : ''}`
                    : `${formatKgValue(set.weightKg)}×${set.repetitions ?? '—'}`,
                )
                .join(' · ')}
            </span>
            {s.volumeKg > 0 && (
              <span className="text-text-muted">{m.volume(formatKgValue(s.volumeKg))}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function IncrementForm({
  profileId,
  exerciseId,
  history,
}: {
  profileId: string;
  exerciseId: string;
  history: ExerciseHistoryDto;
}) {
  const save = useSetExerciseIncrement(profileId, exerciseId);
  const [value, setValue] = useState(
    history.loadIncrementKg === null ? '' : formatKgValue(history.loadIncrementKg),
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = value.trim() ? parseDecimal(value) : null;
    if (value.trim() && (parsed === null || parsed <= 0 || parsed > 50)) {
      return setMessage({ ok: false, text: m.invalidIncrement });
    }
    try {
      await save.mutateAsync(parsed);
      setMessage({ ok: true, text: m.incrementSaved });
    } catch (err) {
      setMessage({
        ok: false,
        text:
          errorCode(err) === 'exercise.increment_out_of_range'
            ? m.invalidIncrement
            : m.genericError,
      });
    }
  };

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="flex flex-col gap-1 border-t border-border pt-3"
    >
      <span className="text-sm font-semibold">{m.incrementTitle}</span>
      <span className="text-xs text-text-muted">{m.incrementHint}</span>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          inputMode="decimal"
          aria-label={m.incrementLabel}
          placeholder="2,5"
          className="min-h-9 w-24"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="text-sm text-text-muted">kg</span>
        <Button type="submit" variant="secondary" className="min-h-9" disabled={save.isPending}>
          {m.incrementSave}
        </Button>
        {message && (
          <span
            role={message.ok ? 'status' : 'alert'}
            className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
