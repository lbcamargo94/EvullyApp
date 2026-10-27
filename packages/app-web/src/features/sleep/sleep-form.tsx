import {
  errorCode,
  isoToLocalTime,
  localDateTimeToIso,
  localToday,
  nightClockDate,
  parseLocalDate,
  useRegisterSleep,
  useUpdateSleep,
} from '@evully/app-core';
import type { SleepLogDto } from '@evully/contracts';
import { Button, Card, Field, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import {
  formatDayMonth,
  formatDuration,
  qualityLabels,
  sleepErrorByCode,
  sleepMessages as m,
} from './messages.pt-BR';

const QUALITIES = [5, 4, 3, 2, 1];

function initialValues(n: SleepLogDto | null) {
  return {
    date: n?.sleepDate ?? (localToday() as string),
    bed: n ? isoToLocalTime(n.bedTime) : '',
    asleep: n?.sleepTime ? isoToLocalTime(n.sleepTime) : '',
    wake: n ? isoToLocalTime(n.wakeTime) : '',
    quality: n?.quality ? String(n.quality) : '',
    notes: n?.notes ?? '',
  };
}
type Values = ReturnType<typeof initialValues>;

const minutesOf = (time: string) => {
  const [h, min] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (min ?? 0);
};

/** Clock times → instants; bed and asleep times at or after the wake time were the evening before. */
function toInput(v: Values) {
  if (!v.date || !v.bed || !v.wake) return null;
  const wakeDate = parseLocalDate(v.date);
  const at = (time: string) =>
    localDateTimeToIso(nightClockDate(wakeDate, minutesOf(time), minutesOf(v.wake)), time);
  return {
    sleepDate: v.date,
    bedTime: at(v.bed),
    sleepTime: v.asleep ? at(v.asleep) : null,
    wakeTime: localDateTimeToIso(v.date, v.wake),
    quality: v.quality ? Number(v.quality) : null,
    notes: v.notes.trim() || null,
  };
}

/** Preview of the total; the saved duration is always derived by the use case (README §7.7). */
function previewMinutes(v: Values): number | null {
  const input = toInput(v);
  if (!input) return null;
  const minutes =
    (Date.parse(input.wakeTime) - Date.parse(input.sleepTime ?? input.bedTime)) / 60_000;
  return minutes > 0 ? Math.round(minutes) : null;
}

type Message = { ok: boolean; text: string; duplicateOf?: string };

/** Simple night entry (README §12.1): asleep, awake and the total. */
export function SleepForm({
  profileId,
  editing,
  onDone,
  onEditDate,
}: {
  profileId: string;
  editing: SleepLogDto | null;
  onDone: () => void;
  /** Opens the night already registered on that day. */
  onEditDate: (date: string) => void;
}) {
  const register = useRegisterSleep(profileId);
  const update = useUpdateSleep(profileId);
  const [v, setV] = useState(() => initialValues(editing));
  const [message, setMessage] = useState<Message | null>(null);
  const busy = register.isPending || update.isPending;
  const set = (patch: Partial<Values>) => setV((c) => ({ ...c, ...patch }));
  const total = previewMinutes(v);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = toInput(v);
    if (!input) return setMessage({ ok: false, text: m.required });
    try {
      if (editing) await update.mutateAsync({ ...input, id: editing.id });
      else await register.mutateAsync(input);
      setV(initialValues(null));
      setMessage(editing ? null : { ok: true, text: m.saved });
      onDone();
    } catch (err) {
      const code = errorCode(err) ?? '';
      if (code === 'sleep.duplicate') {
        return setMessage({
          ok: false,
          text: m.duplicate(formatDayMonth(input.sleepDate)),
          duplicateOf: input.sleepDate,
        });
      }
      setMessage({ ok: false, text: sleepErrorByCode[code] ?? m.genericError });
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_340px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <TimeFields v={v} set={set} />
        <p className="text-sm" aria-live="polite">
          <span className="text-text-muted">{m.total}: </span>
          <span className="font-semibold tabular-nums">
            {total === null ? '—' : formatDuration(total)}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field id="sleep-quality" label={m.quality} hint={m.optional}>
            <NativeSelect
              id="sleep-quality"
              value={v.quality}
              onChange={(e) => set({ quality: e.target.value })}
            >
              <option value="">{m.noQuality}</option>
              {QUALITIES.map((q) => (
                <option key={q} value={q}>
                  {qualityLabels[q]}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="sleep-notes" label={m.notes} hint={m.optional}>
            <Input
              id="sleep-notes"
              maxLength={280}
              value={v.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>
        </div>
        {message && (
          <div className="flex flex-wrap items-center gap-2">
            <p
              role={message.ok ? 'status' : 'alert'}
              className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
            >
              {message.text}
            </p>
            {message.duplicateOf && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMessage(null);
                  onEditDate(message.duplicateOf ?? '');
                }}
              >
                {m.editExisting}
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? m.saving : editing ? m.saveEdit : m.save}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={onDone}>
              {m.cancel}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function TimeFields({ v, set }: { v: Values; set: (patch: Partial<Values>) => void }) {
  const times = [
    ['bed', m.bedTime, undefined],
    ['asleep', m.sleepTime, m.optional],
    ['wake', m.wakeTime, undefined],
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      <Field id="sleep-date" label={m.wakeDate}>
        <Input
          id="sleep-date"
          type="date"
          max={localToday()}
          value={v.date}
          onChange={(e) => set({ date: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        {times.map(([key, label, hint]) => (
          <Field key={key} id={`sleep-${key}`} label={label} hint={hint}>
            <Input
              id={`sleep-${key}`}
              type="time"
              value={v[key]}
              onChange={(e) => set({ [key]: e.target.value })}
            />
          </Field>
        ))}
      </div>
      <p className="text-xs text-text-muted">{m.sleepTimeHint}</p>
    </div>
  );
}
