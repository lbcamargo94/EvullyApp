import { addDays, localToday, parseLocalDate, useHabitDay } from '@evully/app-core';
import { Button, Card, EmptyState, HabitsIllustration, Icon } from '@evully/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatLongDate } from '../shell/messages.pt-BR';
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" aria-label={m.previousDay} onClick={() => go(-1)}>
          <Icon icon={ChevronLeft} size="md" />
        </Button>
        <div className="flex min-w-56 flex-col items-center" aria-live="polite">
          <h2 className="text-heading font-semibold first-letter:uppercase">{label}</h2>
          {date === today && (
            <span className="text-caption text-text-muted">{formatLongDate(date)}</span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          aria-label={m.nextDay}
          disabled={date >= today}
          onClick={() => go(1)}
        >
          <Icon icon={ChevronRight} size="md" />
        </Button>
        {date !== today && (
          <Button type="button" variant="secondary" onClick={() => setDate(today)}>
            {m.backToToday}
          </Button>
        )}
      </div>
      {day && day.habits.length === 0 && (
        <Card>
          <EmptyState
            title={m.emptyTitle}
            illustration={<HabitsIllustration />}
            action={<ExamplesButton profileId={profileId} />}
          >
            {m.empty}
          </EmptyState>
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
