import { addDays, localToday, parseLocalDate, useHabitDay } from '@evully/app-core';
import { Button, Card } from '@evully/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { HabitRow } from './habit-row';
import { ExamplesButton } from './habit-manager';
import { habitMessages as m } from './messages.pt-BR';

const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
});

/** The day's habits; no future days (README §11.2). */
export function HabitDayView({ profileId }: { profileId: string }) {
  const today = localToday();
  const [date, setDate] = useState<string>(today);
  const { data: day } = useHabitDay(profileId, date);
  const go = (n: number) => setDate(addDays(parseLocalDate(date), n));
  const label = date === today ? m.today : dateLabel.format(new Date(`${date}T12:00:00`));

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" aria-label={m.previousDay} onClick={() => go(-1)}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <h2
          className="min-w-48 text-center text-lg font-semibold first-letter:uppercase"
          aria-live="polite"
        >
          {label}
        </h2>
        <Button
          type="button"
          variant="ghost"
          aria-label={m.nextDay}
          disabled={date >= today}
          onClick={() => go(1)}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
        {date !== today && (
          <Button type="button" variant="secondary" onClick={() => setDate(today)}>
            {m.backToToday}
          </Button>
        )}
      </div>
      {day && day.habits.length === 0 && (
        <Card className="gap-3">
          <p className="text-text-muted">{m.empty}</p>
          <ExamplesButton profileId={profileId} />
        </Card>
      )}
      {day && day.habits.length > 0 && (
        <Card className="gap-0 p-0">
          <ul className="flex flex-col">
            {day.habits.map((h) => (
              <HabitRow
                key={`${h.id}:${date}:${h.value ?? ''}`}
                profileId={profileId}
                date={date}
                habit={h}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
