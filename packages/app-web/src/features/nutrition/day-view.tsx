import {
  addDays,
  localToday,
  useNutritionDay,
  useNutritionPreferences,
  visibleMeals,
} from '@evully/app-core';
import type { FoodLogDto } from '@evully/contracts';
import { Button, Card, Input } from '@evully/ui';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { DayTotals } from './day-totals';
import { WaterCard } from './water-card';
import { MealSection, type MealKey } from './meal-section';
import { dietMessages as m } from './messages.pt-BR';

const PLANNING_DAYS = 30;

/**
 * Meals chosen in the questionnaire (plus any meal with foods that day), then
 * custom meals in the order they appear (README §9.3).
 */
function mealsOf(logs: FoodLogDto[], chosen: MealKey['mealType'][], extra: string[]): MealKey[] {
  const custom = [
    ...new Set([
      ...logs.filter((l) => l.mealType === 'custom').map((l) => l.mealName ?? ''),
      ...extra,
    ]),
  ];
  const standard = visibleMeals(
    chosen.filter((t) => t !== 'custom'),
    logs.map((l) => l.mealType),
  );
  return [
    ...standard.map((mealType) => ({ mealType, mealName: null })),
    ...custom.map((mealName) => ({ mealType: 'custom' as const, mealName })),
  ];
}

const sameMeal = (log: FoodLogDto, meal: MealKey) =>
  log.mealType === meal.mealType && (meal.mealType !== 'custom' || log.mealName === meal.mealName);

export function DayView({ profileId }: { profileId: string }) {
  const today = localToday();
  const [date, setDate] = useState<string>(today);
  const [extraMeals, setExtraMeals] = useState<string[]>([]);
  const { data: day } = useNutritionDay(profileId, date);
  const { data: prefs } = useNutritionPreferences(profileId);
  const { data: yesterday } = useNutritionDay(profileId, addDays(date as typeof today, -1));
  const isFuture = date > today;
  const lastDay = addDays(today, PLANNING_DAYS);

  const go = (days: number) => {
    setExtraMeals([]);
    setDate(addDays(date as typeof today, days));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" aria-label={m.previousDay} onClick={() => go(-1)}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <h2 className="min-w-48 text-center text-lg font-semibold" aria-live="polite">
          {m.dayLabel(date, today, addDays(today, -1), addDays(today, 1))}
        </h2>
        <Button
          type="button"
          variant="ghost"
          aria-label={m.nextDay}
          disabled={date >= lastDay}
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
      {isFuture && <p className="text-sm text-text-muted">{m.planningHint}</p>}
      {day && <DayTotals day={day} />}
      {day && prefs?.trackWater && <WaterCard profileId={profileId} day={day} canLog={!isFuture} />}
      {day &&
        prefs &&
        mealsOf(day.logs, prefs.meals, extraMeals).map((meal) => (
          <MealSection
            key={`${meal.mealType}:${meal.mealName ?? ''}`}
            profileId={profileId}
            date={date}
            meal={meal}
            logs={day.logs.filter((l) => sameMeal(l, meal))}
            canConsume={!isFuture}
            yesterdayHasItems={!!yesterday?.logs.some((l) => sameMeal(l, meal))}
          />
        ))}
      <NewMeal onCreate={(name) => setExtraMeals((names) => [...names, name])} />
    </div>
  );
}

/** A custom meal exists on screen until its first food is added. */
function NewMeal({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState<string | null>(null);
  if (name === null) {
    return (
      <Button type="button" variant="secondary" className="self-start" onClick={() => setName('')}>
        <Plus aria-hidden="true" className="size-4" />
        {m.newMeal}
      </Button>
    );
  }
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    onCreate(clean);
    setName(null);
  };
  return (
    <Card>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          aria-label={m.newMealName}
          placeholder={m.newMealPlaceholder}
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-64 flex-1"
        />
        <Button type="submit">{m.createMeal}</Button>
        <Button type="button" variant="ghost" onClick={() => setName(null)}>
          {m.cancel}
        </Button>
      </form>
    </Card>
  );
}
