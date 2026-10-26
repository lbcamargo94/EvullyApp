import { localToday, useCardioOverview, useHabitDay } from '@evully/app-core';
import { Card } from '@evully/ui';
import { Check, Circle } from 'lucide-react';
import { Link } from 'react-router';
import { CardioTargetProgress } from '../cardio/cardio-target';
import { shellMessages as m } from './messages.pt-BR';

function CardHeader({
  id,
  title,
  to,
  link,
}: {
  id: string;
  title: string;
  to: string;
  link: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <Link to={to} className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
        {link}
      </Link>
    </div>
  );
}

/** Today's habits on the dashboard (README §11.2); hidden until the profile has habits. */
function TodayHabitsCard({ profileId }: { profileId: string }) {
  const { data: day } = useHabitDay(profileId, localToday());
  if (!day || day.habits.length === 0) return null;
  const done = day.habits.filter((h) => h.done).length;

  return (
    <Card aria-labelledby="today-habits-title" className="gap-3">
      <CardHeader
        id="today-habits-title"
        title={m.habitsTitle}
        to="/app/habits"
        link={m.openHabits}
      />
      <span className="font-semibold tabular-nums">{m.habitsDone(done, day.habits.length)}</span>
      <ul className="flex flex-col gap-1 text-sm">
        {day.habits.map((h) => (
          <li key={h.id} className="flex items-center gap-2">
            {h.done ? (
              <Check aria-hidden="true" className="size-4 text-brand" />
            ) : (
              <Circle aria-hidden="true" className="size-4 text-text-muted" />
            )}
            <span className={h.done ? undefined : 'text-text-muted'}>{h.name}</span>
            <span className="sr-only">{h.done ? m.habitDone : m.habitPending}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** This week's cardio on the dashboard (README §11.1); hidden until the profile uses cardio. */
function WeekCardioCard({ profileId }: { profileId: string }) {
  const { data: overview } = useCardioOverview(profileId);
  if (!overview || (overview.weeks.length === 0 && !overview.target)) return null;
  const { thisWeek: week, target } = overview;

  return (
    <Card aria-labelledby="week-cardio-title" className="gap-3">
      <CardHeader
        id="week-cardio-title"
        title={m.cardioTitle}
        to="/app/cardio"
        link={m.openCardio}
      />
      <span className="font-semibold tabular-nums">
        {m.cardioWeek(week.sessions, week.minutes)}
      </span>
      {target && <CardioTargetProgress week={week} target={target} />}
    </Card>
  );
}

/** Habits and cardio on the dashboard; each card only for profiles that use the module. */
export function TodayActivityCards({ profileId }: { profileId: string }) {
  return (
    <div className="grid gap-5 empty:hidden sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
      <TodayHabitsCard profileId={profileId} />
      <WeekCardioCard profileId={profileId} />
    </div>
  );
}
