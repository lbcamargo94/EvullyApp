import { addDays, errorCode, parseDecimal, parseLocalDate, useLogHabit } from '@evully/app-core';
import type { HabitDay } from '@evully/contracts';
import { Input } from '@evully/ui';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import {
  formatNumber,
  formatWeekdayLetter,
  habitErrorByCode,
  habitMessages as m,
  minutesToTime,
  timeToMinutes,
} from './messages.pt-BR';

type Habit = HabitDay['habits'][number];

const initialText = (h: Habit) => {
  if (h.value === null) return '';
  if (h.type === 'time') return minutesToTime(h.value);
  return h.type === 'boolean' ? '' : String(h.value).replace('.', ',');
};

/** Reads the typed value for the habit type; undefined when it cannot be read. */
function readValue(h: Habit, raw: string): number | null | undefined {
  const text = raw.trim();
  if (!text) return null;
  if (h.type === 'time') return timeToMinutes(text) ?? undefined;
  const value = parseDecimal(text);
  if (value === null) return undefined;
  return h.type === 'duration' && !Number.isInteger(value) ? undefined : value;
}

/** One habit on a day: input by type, saved on change/blur, and the last 7 days. */
export function HabitRow({
  profileId,
  date,
  habit: h,
}: {
  profileId: string;
  date: string;
  habit: Habit;
}) {
  const log = useLogHabit(profileId);
  const [text, setText] = useState(initialText(h));
  const [error, setError] = useState<string | null>(null);

  const save = async (value: number | null) => {
    try {
      await log.mutateAsync({ habitId: h.id, date, value });
      setError(null);
    } catch (e) {
      setError(habitErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };
  const commit = () => {
    const value = readValue(h, text);
    if (value === undefined) return setError(m.invalidValue);
    if (value !== h.value) void save(value);
  };

  return (
    <li className="flex flex-col gap-1 border-b border-border px-5 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-40 flex-1 flex-col">
          <span className="font-semibold">{h.name}</span>
          {h.targetValue !== null && (
            <span className="text-sm text-text-muted">
              {m.target(
                formatNumber(h.targetValue),
                h.type === 'duration' ? m.minutesUnit : h.unit,
              )}
            </span>
          )}
        </div>
        {h.type === 'boolean' ? (
          <input
            type="checkbox"
            className="size-7 accent-brand"
            aria-label={h.name}
            checked={h.value === 1}
            disabled={log.isPending}
            onChange={(e) => void save(e.target.checked ? 1 : null)}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              type={h.type === 'time' ? 'time' : 'text'}
              inputMode={h.type === 'time' ? undefined : 'decimal'}
              aria-label={m.valueOf(h.name)}
              className="min-h-10 w-28 text-right tabular-nums"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <span className="w-14 text-sm text-text-muted">
              {h.type === 'duration' ? m.minutesUnit : h.type === 'quantity' ? (h.unit ?? '') : ''}
            </span>
            {h.value !== null && (
              <button
                type="button"
                aria-label={m.clear(h.name)}
                onClick={() => {
                  setText('');
                  void save(null);
                }}
                className="rounded-sm p-1.5 text-text-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>
        )}
        {h.done && <Check aria-label={m.done} className="size-5 text-brand" />}
        <Last7 date={date} days={h.last7} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}

function Last7({ date, days }: { date: string; days: boolean[] }) {
  const count = days.filter(Boolean).length;
  return (
    <div className="flex items-center gap-2" aria-label={`${m.last7}: ${m.done7(count)}`}>
      <ol className="flex gap-1">
        {days.map((done, i) => {
          const d = addDays(parseLocalDate(date), i - days.length + 1);
          return (
            <li
              key={d}
              title={m.dayDone(formatWeekdayLetter(d), done)}
              className={
                done ? 'size-3 rounded-full bg-brand' : 'size-3 rounded-full border border-border'
              }
            />
          );
        })}
      </ol>
      <span className="w-16 text-xs text-text-muted tabular-nums">{m.done7(count)}</span>
    </div>
  );
}
