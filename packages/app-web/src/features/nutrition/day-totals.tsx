import type { NutritionDay } from '@evully/contracts';
import { Card } from '@evully/ui';
import { dietMessages as m, formatNumber } from './messages.pt-BR';

type Totals = NutritionDay['totals']['planned'];

/** Consumed vs. planned for the day (README §9.5). Targets arrive in alpha.4 (§9.9). */
export function DayTotals({ totals }: { totals: NutritionDay['totals'] }) {
  return (
    <Card aria-labelledby="day-totals-title" className="gap-3">
      <h3 id="day-totals-title" className="text-base font-semibold">
        {m.totalsTitle}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Column label={m.consumed} totals={totals.consumed} strong />
        <Column label={m.planned} totals={totals.planned} />
      </div>
    </Card>
  );
}

function Column({ label, totals, strong }: { label: string; totals: Totals; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-text-muted">{label}</span>
      <span
        className={
          strong
            ? 'text-[32px] leading-tight font-semibold tabular-nums'
            : 'text-xl font-semibold tabular-nums'
        }
      >
        {m.kcal(formatNumber(totals.caloriesKcal))}
      </span>
      <span className="text-sm text-text-muted tabular-nums">
        {m.macros(
          formatNumber(totals.proteinG),
          formatNumber(totals.carbohydrateG),
          formatNumber(totals.fatG),
        )}
      </span>
    </div>
  );
}
