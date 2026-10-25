import { errorCode, useSetMealConsumed } from '@evully/app-core';
import type { FoodLogDto, MealType } from '@evully/contracts';
import { Button, Card } from '@evully/ui';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { AddFoodLog } from './add-food-log';
import { FoodLogRow } from './food-log-row';
import { MealActions } from './meal-actions';
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
  yesterdayHasItems,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
  logs: FoodLogDto[];
  canConsume: boolean;
  yesterdayHasItems: boolean;
}) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const title = titleOf(meal);
  const kcal = logs.reduce((total, l) => total + l.nutrients.caloriesKcal, 0);

  return (
    <Card aria-label={title} className="gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 text-base font-semibold">
          {title}
          {logs.length > 0 && (
            <span className="ml-2 text-sm font-normal text-text-muted tabular-nums">
              {m.kcal(formatNumber(Math.round(kcal)))}
            </span>
          )}
        </h3>
        {logs.length > 0 && canConsume && (
          <ConsumeMealButton
            profileId={profileId}
            date={date}
            meal={meal}
            logs={logs}
            onError={(text) => setMessage({ ok: false, text })}
          />
        )}
        {/* Panels opened from the menu wrap below the header at full width. */}
        <MealActions
          profileId={profileId}
          date={date}
          meal={meal}
          title={title}
          hasItems={logs.length > 0}
          yesterdayHasItems={yesterdayHasItems}
          onMessage={setMessage}
        />
      </div>
      {logs.length === 0 && <p className="text-sm text-text-muted">{m.emptyMeal}</p>}
      {logs.length > 0 && (
        <ul className="flex flex-col">
          {logs.map((log) => (
            <FoodLogRow key={log.id} profileId={profileId} log={log} canConsume={canConsume} />
          ))}
        </ul>
      )}
      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
        >
          {message.text}
        </p>
      )}
      <AddFoodLog profileId={profileId} date={date} meal={meal} />
    </Card>
  );
}

function ConsumeMealButton({
  profileId,
  date,
  meal,
  logs,
  onError,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
  logs: FoodLogDto[];
  onError: (text: string) => void;
}) {
  const setMeal = useSetMealConsumed(profileId);
  const allConsumed = logs.every((l) => l.consumedAt !== null);
  const toggle = async () => {
    try {
      await setMeal.mutateAsync({ date, ...meal, consumed: !allConsumed });
    } catch (e) {
      onError(foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };
  return (
    <Button
      type="button"
      variant={allConsumed ? 'secondary' : 'ghost'}
      aria-pressed={allConsumed}
      disabled={setMeal.isPending}
      onClick={() => void toggle()}
    >
      {allConsumed && <Check aria-hidden="true" className="size-4" />}
      {allConsumed ? m.unmarkMeal : m.markMeal}
    </Button>
  );
}
