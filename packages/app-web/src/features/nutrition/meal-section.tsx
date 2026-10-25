import { errorCode, useSetMealConsumed } from '@evully/app-core';
import type { FoodLogDto, MealType } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { AddFoodLog } from './add-food-log';
import { FoodLogRow } from './food-log-row';
import { dietMessages as m, foodLogErrorByCode, formatNumber, mealLabels } from './messages.pt-BR';

export interface MealKey {
  mealType: MealType;
  mealName: string | null;
}

const titleOf = (meal: MealKey) =>
  meal.mealType === 'custom' ? (meal.mealName ?? '') : mealLabels[meal.mealType];

export function MealSection({
  profileId,
  date,
  meal,
  logs,
  canConsume,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
  logs: FoodLogDto[];
  canConsume: boolean;
}) {
  const setMeal = useSetMealConsumed(profileId);
  const [error, setError] = useState<string | null>(null);
  const title = titleOf(meal);
  const allConsumed = logs.length > 0 && logs.every((l) => l.consumedAt !== null);
  const kcal = logs.reduce((total, l) => total + l.nutrients.caloriesKcal, 0);

  const toggleMeal = async () => {
    try {
      await setMeal.mutateAsync({ date, ...meal, consumed: !allConsumed });
      setError(null);
    } catch (e) {
      setError(foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-label={title} className="gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">
          {title}
          {logs.length > 0 && (
            <span className="ml-2 text-sm font-normal text-text-muted tabular-nums">
              {m.kcal(formatNumber(Math.round(kcal)))}
            </span>
          )}
        </h3>
        {logs.length > 0 && canConsume && (
          <Button
            type="button"
            variant={allConsumed ? 'secondary' : 'ghost'}
            aria-pressed={allConsumed}
            disabled={setMeal.isPending}
            onClick={() => void toggleMeal()}
          >
            {allConsumed && <Check aria-hidden="true" className="size-4" />}
            {allConsumed ? m.unmarkMeal : m.markMeal}
          </Button>
        )}
      </div>
      {logs.length === 0 && <p className="text-sm text-text-muted">{m.emptyMeal}</p>}
      {logs.length > 0 && (
        <ul className="flex flex-col">
          {logs.map((log) => (
            <FoodLogRow key={log.id} profileId={profileId} log={log} canConsume={canConsume} />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <AddFoodLog profileId={profileId} date={date} meal={meal} />
    </Card>
  );
}
