import {
  useAppSettings,
  useReminderSettings,
  useSetReminderSettings,
  useUpdateAppSettings,
} from '@evully/app-core';
import type { ReminderPreference, ReminderSettings, ReminderType } from '@evully/contracts';
import { Button, Card, Field, Input, NativeSelect, Switch } from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { remindersMessages as m } from './messages.pt-BR';
import { useSaveFeedback } from './settings-feedback';
import { useSavedToggle } from '../shared/use-saved-toggle';

const DEFAULT_QUIET = { start: '22:00', end: '07:00' };
/** Reminders that show on one chosen weekday (README §25). */
const WEEKLY: readonly ReminderType[] = ['measurements', 'weekly_summary'];

function PreferenceRow({
  preference,
  onChange,
}: {
  preference: ReminderPreference;
  onChange: (next: ReminderPreference) => void;
}) {
  const { type } = preference;
  const id = `reminder-${type}`;
  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-start justify-between gap-4">
        <label htmlFor={id} className="flex flex-col gap-0.5">
          <span className="text-body font-semibold">{m.names[type]}</span>
          <span className="text-caption text-text-muted">{m.descriptions[type]}</span>
        </label>
        <Switch
          id={id}
          checked={preference.enabled}
          onChange={(e) => onChange({ ...preference, enabled: e.target.checked })}
        />
      </div>
      {preference.enabled && (
        <div className="grid gap-4 sm:grid-cols-2">
          {WEEKLY.includes(type) && (
            <Field id={`${id}-weekday`} label={m.weekdayOf(m.names[type])}>
              <NativeSelect
                id={`${id}-weekday`}
                value={preference.weekday ?? 1}
                onChange={(e) => onChange({ ...preference, weekday: Number(e.target.value) })}
              >
                {m.weekdays.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <Field id={`${id}-time`} label={m.timeOf(m.names[type])}>
            <Input
              id={`${id}-time`}
              type="time"
              value={preference.time}
              onChange={(e) => onChange({ ...preference, time: e.target.value })}
            />
          </Field>
        </div>
      )}
    </li>
  );
}

function RemindersForm({ profileId, saved }: { profileId: string; saved: ReminderSettings }) {
  const save = useSetReminderSettings(profileId);
  const feedback = useSaveFeedback();
  const [draft, setDraft] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const setPreference = (type: ReminderType, next: ReminderPreference) =>
    setDraft((d) => ({
      ...d,
      preferences: d.preferences.map((p) => (p.type === type ? next : p)),
    }));
  const quiet = draft.quietHours;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const times = [...draft.preferences.map((p) => p.time), quiet?.start, quiet?.end];
    if (times.some((t) => t !== undefined && !/^\d{2}:\d{2}$/.test(t)))
      return setError(m.invalidTime);
    setError(null);
    void feedback.run(() => save.mutateAsync(draft));
  };

  return (
    <form noValidate aria-label={m.title} onSubmit={submit} className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border/60">
        {draft.preferences.map((p) => (
          <PreferenceRow
            key={p.type}
            preference={p}
            onChange={(next) => setPreference(p.type, next)}
          />
        ))}
      </ul>
      <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-start justify-between gap-4">
          <label htmlFor="reminder-quiet" className="flex flex-col gap-0.5">
            <span className="text-body font-semibold">{m.quietTitle}</span>
            <span className="text-caption text-text-muted">{m.quietHint}</span>
          </label>
          <Switch
            id="reminder-quiet"
            checked={quiet !== null}
            onChange={(e) =>
              setDraft((d) => ({ ...d, quietHours: e.target.checked ? DEFAULT_QUIET : null }))
            }
          />
        </div>
        {quiet && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="reminder-quiet-start" label={m.quietStart}>
              <Input
                id="reminder-quiet-start"
                type="time"
                value={quiet.start}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quietHours: { ...quiet, start: e.target.value } }))
                }
              />
            </Field>
            <Field id="reminder-quiet-end" label={m.quietEnd}>
              <Input
                id="reminder-quiet-end"
                type="time"
                value={quiet.end}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, quietHours: { ...quiet, end: e.target.value } }))
                }
              />
            </Field>
          </div>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="secondary" busy={save.isPending}>
          {m.save}
        </Button>
      </div>
      {feedback.node}
    </form>
  );
}

/** App-wide: Evully opens in the tray when Windows starts (off by default). */
function StartWithWindows() {
  const { data: settings } = useAppSettings();
  const update = useUpdateAppSettings();
  const [on, toggle] = useSavedToggle(settings?.startWithWindows ?? false, (next) =>
    update.mutateAsync({ startWithWindows: next }),
  );
  if (!settings) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
      <label htmlFor="start-with-windows" className="flex flex-col gap-0.5">
        <span className="text-body font-semibold">{m.startTitle}</span>
        <span className="text-caption text-text-muted">{m.startHint}</span>
      </label>
      <Switch id="start-with-windows" checked={on} onChange={(e) => toggle(e.target.checked)} />
    </div>
  );
}

/** Settings › Lembretes (README §25): each reminder, its time and the quiet hours. */
export function RemindersSection({ profileId }: { profileId: string }) {
  const { data } = useReminderSettings(profileId);
  if (!data) return null;
  return (
    <Card aria-labelledby="reminders-title">
      <div className="flex flex-col gap-1">
        <h2 id="reminders-title" className="text-heading font-semibold">
          {m.title}
        </h2>
        <p className="text-caption text-text-muted">{m.description}</p>
      </div>
      <RemindersForm profileId={profileId} saved={data} />
      <StartWithWindows />
    </Card>
  );
}
