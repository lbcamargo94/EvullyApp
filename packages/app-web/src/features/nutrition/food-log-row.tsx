import {
  errorCode,
  parseDecimal,
  useRemoveFoodLog,
  useSetFoodLogConsumed,
  useUpdateFoodLogQuantity,
} from '@evully/app-core';
import type { FoodLogDto } from '@evully/contracts';
import { Button, Input } from '@evully/ui';
import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { dietMessages as m, foodLogErrorByCode, formatNumber, unitLabels } from './messages.pt-BR';

const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, useGrouping: false });

/** One food of a meal: consumed checkbox, quantity recalculated on save, remove. */
export function FoodLogRow({
  profileId,
  log,
  canConsume,
}: {
  profileId: string;
  log: FoodLogDto;
  canConsume: boolean;
}) {
  const update = useUpdateFoodLogQuantity(profileId);
  const consume = useSetFoodLogConsumed(profileId);
  const remove = useRemoveFoodLog(profileId);
  const [quantity, setQuantity] = useState(plain.format(log.quantity));
  const [error, setError] = useState<string | null>(null);
  const n = log.nutrients;

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
    } catch (e) {
      setError(foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  const saveQuantity = () => {
    const value = parseDecimal(quantity);
    if (value === null || value === log.quantity) {
      setQuantity(plain.format(log.quantity));
      return;
    }
    void run(() => update.mutateAsync({ id: log.id, quantity: value }));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') setQuantity(plain.format(log.quantity));
  };

  return (
    <li className="flex flex-col gap-1 border-t border-border py-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-brand"
          aria-label={m.consumedItem(log.foodName)}
          checked={log.consumedAt !== null}
          disabled={!canConsume || consume.isPending}
          onChange={(e) =>
            void run(() => consume.mutateAsync({ id: log.id, consumed: e.target.checked }))
          }
        />
        <div className="flex min-w-40 flex-1 flex-col">
          <span className="font-medium">
            {log.foodName}
            {log.brand && <span className="font-normal text-text-muted"> · {log.brand}</span>}
          </span>
          <span className="text-sm text-text-muted tabular-nums">
            {m.kcal(formatNumber(n.caloriesKcal))} ·{' '}
            {m.macros(
              formatNumber(n.proteinG),
              formatNumber(n.carbohydrateG),
              formatNumber(n.fatG),
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            inputMode="decimal"
            aria-label={m.quantityOf(log.foodName)}
            className="min-h-9 w-20 text-right tabular-nums"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={saveQuantity}
            onKeyDown={onKeyDown}
          />
          <span className="w-12 text-sm text-text-muted">{unitLabels[log.unit]}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-2"
          aria-label={m.removeItem(log.foodName)}
          disabled={remove.isPending}
          onClick={() => void run(() => remove.mutateAsync(log.id))}
        >
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
