import { errorCode, foodSearchKey, useRemoveFood } from '@evully/app-core';
import type { FoodDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog, EmptyState, Input } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { foodErrorByCode, foodMessages as m, formatNumber, unitLabels } from './messages.pt-BR';

const describe = (f: FoodDto) =>
  m.summary(
    formatNumber(f.referenceAmount),
    unitLabels[f.referenceUnit],
    formatNumber(f.caloriesKcal),
    formatNumber(f.proteinG),
    formatNumber(f.carbohydrateG),
    formatNumber(f.fatG),
  );

/** Catalog with accent-insensitive search; removal asks for confirmation. */
export function FoodList({ foods, onEdit }: { foods: FoodDto[]; onEdit: (food: FoodDto) => void }) {
  const remove = useRemoveFood();
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<FoodDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const q = foodSearchKey(query);
  const shown = q
    ? foods.filter((f) => foodSearchKey(`${f.name} ${f.brand ?? ''}`).includes(q))
    : foods;

  const confirmRemove = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(foodErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <Card aria-labelledby="food-list-title" className="flex-[2_1_420px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="food-list-title" className="text-lg font-semibold">
          {m.listTitle}
        </h2>
        <span className="text-sm text-text-muted">{m.count(foods.length)}</span>
      </div>
      <Input
        type="search"
        aria-label={m.search}
        placeholder={m.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {foods.length === 0 && <EmptyState>{m.empty}</EmptyState>}
      {foods.length > 0 && shown.length === 0 && (
        <p className="text-sm text-text-muted">{m.noResults}</p>
      )}
      <ul className="flex flex-col">
        {shown.map((f) => (
          <li key={f.id} className="flex items-center gap-2 border-t border-border py-2.5">
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold">
                {f.name}
                {f.brand && <span className="font-normal text-text-muted"> · {f.brand}</span>}
              </span>
              <span className="text-sm text-text-muted tabular-nums">{describe(f)}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.edit(f.name)}
              onClick={() => onEdit(f)}
            >
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.remove(f.name)}
              onClick={() => setPending(f)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.removeTitle}
        description={m.removeBody(pending?.name ?? '')}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  );
}
