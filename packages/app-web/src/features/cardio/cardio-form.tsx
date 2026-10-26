import {
  errorCode,
  isoToLocalTime,
  localDateTimeToIso,
  localNowTime,
  localToday,
  parseDecimal,
  useRegisterCardio,
  useUpdateCardio,
} from '@evully/app-core';
import type { CardioActivity, CardioIntensity, CardioSessionDto } from '@evully/contracts';
import { Button, Card, Field, Input, NativeSelect } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import {
  activityLabels,
  cardioErrorByCode,
  cardioMessages as m,
  intensityLabels,
} from './messages.pt-BR';

const ACTIVITIES = Object.keys(activityLabels) as CardioActivity[];
const INTENSITIES = Object.keys(intensityLabels) as CardioIntensity[];
const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false });
const text = (n: number | null) => (n === null ? '' : plain.format(n));

function emptyValues() {
  return {
    activityType: 'walking' as CardioActivity,
    activityName: '',
    date: localToday() as string,
    time: localNowTime(),
    duration: '',
    distance: '',
    steps: '',
    intensity: '' as CardioIntensity | '',
    heartRate: '',
    notes: '',
  };
}

function initialValues(s: CardioSessionDto | null): ReturnType<typeof emptyValues> {
  if (!s) return emptyValues();
  return {
    activityType: s.activityType,
    activityName: s.activityName ?? '',
    date: s.sessionDate,
    time: isoToLocalTime(s.startedAt),
    duration: String(s.durationMinutes),
    distance: text(s.distanceKm),
    steps: text(s.steps),
    intensity: s.intensity ?? '',
    heartRate: text(s.heartRateAverage),
    notes: s.notes ?? '',
  };
}
type Values = ReturnType<typeof initialValues>;

/** Empty → null; a number; or undefined when it cannot be read. */
const read = (raw: string, whole: boolean) => {
  const v = raw.trim();
  if (!v) return null;
  if (whole) return /^\d+$/.test(v) ? Number(v) : undefined;
  return parseDecimal(v) ?? undefined;
};

function toInput(v: Values) {
  const numbers = {
    durationMinutes: read(v.duration, true),
    distanceKm: read(v.distance, false),
    steps: read(v.steps, true),
    heartRateAverage: read(v.heartRate, true),
  };
  const labels = {
    durationMinutes: m.duration,
    distanceKm: m.distance,
    steps: m.steps,
    heartRateAverage: m.heartRate,
  };
  for (const [key, value] of Object.entries(numbers)) {
    if (value === undefined) return labels[key as keyof typeof labels];
  }
  if (numbers.durationMinutes === null) return m.duration;
  return {
    sessionDate: v.date,
    startedAt: localDateTimeToIso(v.date, v.time || '12:00'),
    activityType: v.activityType,
    activityName: v.activityType === 'custom' ? v.activityName.trim() || null : null,
    durationMinutes: numbers.durationMinutes as number,
    distanceKm: numbers.distanceKm ?? null,
    steps: numbers.steps ?? null,
    intensity: v.intensity || null,
    heartRateAverage: numbers.heartRateAverage ?? null,
    notes: v.notes.trim() || null,
  };
}

/** Quick cardio entry (README §11.1); optional details stay folded. */
export function CardioForm({
  profileId,
  editing,
  onDone,
}: {
  profileId: string;
  editing: CardioSessionDto | null;
  onDone: () => void;
}) {
  const register = useRegisterCardio(profileId);
  const update = useUpdateCardio(profileId);
  const [v, setV] = useState(() => initialValues(editing));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const busy = register.isPending || update.isPending;
  const set = (patch: Partial<Values>) => setV((c) => ({ ...c, ...patch }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = toInput(v);
    if (typeof input === 'string') return setMessage({ ok: false, text: m.invalidNumber(input) });
    try {
      if (editing) await update.mutateAsync({ ...input, id: editing.id });
      else await register.mutateAsync(input);
      setV(initialValues(null));
      setMessage(editing ? null : { ok: true, text: m.saved });
      onDone();
    } catch (err) {
      setMessage({ ok: false, text: cardioErrorByCode[errorCode(err) ?? ''] ?? m.genericError });
    }
  };

  return (
    <Card aria-label={editing ? m.editTitle : m.formTitle} className="flex-[1_1_340px]">
      <h2 className="text-lg font-semibold">{editing ? m.editTitle : m.formTitle}</h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <Field id="cardio-activity" label={m.activity}>
          <NativeSelect
            id="cardio-activity"
            value={v.activityType}
            onChange={(e) => set({ activityType: e.target.value as CardioActivity })}
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {activityLabels[a]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {v.activityType === 'custom' && (
          <Field id="cardio-name" label={m.activityName}>
            <Input
              id="cardio-name"
              maxLength={40}
              placeholder={m.activityNamePlaceholder}
              value={v.activityName}
              onChange={(e) => set({ activityName: e.target.value })}
            />
          </Field>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field id="cardio-date" label={m.date}>
            <Input
              id="cardio-date"
              type="date"
              max={localToday()}
              value={v.date}
              onChange={(e) => set({ date: e.target.value })}
            />
          </Field>
          <Field id="cardio-time" label={m.time}>
            <Input
              id="cardio-time"
              type="time"
              value={v.time}
              onChange={(e) => set({ time: e.target.value })}
            />
          </Field>
          <Field id="cardio-duration" label={m.duration}>
            <Input
              id="cardio-duration"
              inputMode="numeric"
              placeholder="45"
              value={v.duration}
              onChange={(e) => set({ duration: e.target.value })}
            />
          </Field>
        </div>
        <details className="flex flex-col gap-3" open={editing !== null}>
          <summary className="cursor-pointer text-sm font-semibold">{m.more}</summary>
          <Details v={v} set={set} />
        </details>
        {message && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
          >
            {message.text}
          </p>
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

function Details({ v, set }: { v: Values; set: (patch: Partial<Values>) => void }) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field id="cardio-distance" label={m.distance} hint={m.optional}>
          <Input
            id="cardio-distance"
            inputMode="decimal"
            value={v.distance}
            onChange={(e) => set({ distance: e.target.value })}
          />
        </Field>
        <Field id="cardio-steps" label={m.steps} hint={m.optional}>
          <Input
            id="cardio-steps"
            inputMode="numeric"
            value={v.steps}
            onChange={(e) => set({ steps: e.target.value })}
          />
        </Field>
        <Field id="cardio-intensity" label={m.intensity} hint={m.optional}>
          <NativeSelect
            id="cardio-intensity"
            value={v.intensity}
            onChange={(e) => set({ intensity: e.target.value as CardioIntensity | '' })}
          >
            <option value="">{m.noIntensity}</option>
            {INTENSITIES.map((i) => (
              <option key={i} value={i}>
                {intensityLabels[i]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="cardio-hr" label={m.heartRate} hint={m.optional}>
          <Input
            id="cardio-hr"
            inputMode="numeric"
            value={v.heartRate}
            onChange={(e) => set({ heartRate: e.target.value })}
          />
        </Field>
      </div>
      <p className="text-xs text-text-muted">{m.stepsHint}</p>
      <Field id="cardio-notes" label={m.notes} hint={m.optional}>
        <Input
          id="cardio-notes"
          maxLength={280}
          value={v.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </Field>
    </div>
  );
}
