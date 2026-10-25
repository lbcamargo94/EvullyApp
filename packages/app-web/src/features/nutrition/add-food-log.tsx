import { errorCode, foodSearchKey, parseDecimal, useAddFoodLog, useFoods } from '@evully/app-core';
import type { FoodDto } from '@evully/contracts';
import { Button, Input } from '@evully/ui';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { MealKey } from './meal-section';
import { dietMessages as m, foodLogErrorByCode, unitLabels } from './messages.pt-BR';

const MAX_RESULTS = 8;
const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, useGrouping: false });

/** Search the catalog, pick a food and its quantity; nothing is guessed for the user. */
export function AddFoodLog({
  profileId,
  date,
  meal,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button type="button" variant="ghost" className="self-start" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" className="size-4" />
        {m.addFood}
      </Button>
    );
  }
  return <Picker profileId={profileId} date={date} meal={meal} onClose={() => setOpen(false)} />;
}

function Picker({
  profileId,
  date,
  meal,
  onClose,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
  onClose: () => void;
}) {
  const { data: foods = [] } = useFoods();
  const add = useAddFoodLog(profileId);
  const [query, setQuery] = useState('');
  const [food, setFood] = useState<FoodDto | null>(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const q = foodSearchKey(query);
  const matches = foods
    .filter((f) => foodSearchKey(`${f.name} ${f.brand ?? ''}`).includes(q))
    .slice(0, MAX_RESULTS);

  const pick = (f: FoodDto) => {
    setFood(f);
    setQuantity(plain.format(f.referenceAmount));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseDecimal(quantity);
    if (!food || value === null) return;
    try {
      await add.mutateAsync({ logDate: date, ...meal, foodId: food.id, quantity: value });
      onClose();
    } catch (err) {
      setError(foodLogErrorByCode[errorCode(err) ?? ''] ?? m.genericError);
    }
  };

  if (foods.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-text-muted">{m.noFoods}</p>
        <Button type="button" variant="ghost" onClick={onClose}>
          {m.cancel}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="flex flex-col gap-2 rounded-md bg-surface-muted p-3"
    >
      {food ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{food.name}</span>
          <Input
            autoFocus
            inputMode="decimal"
            aria-label={m.quantity(unitLabels[food.referenceUnit])}
            className="min-h-9 w-24 text-right tabular-nums"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <span className="text-sm text-text-muted">{unitLabels[food.referenceUnit]}</span>
          <Button type="submit" className="min-h-9" disabled={add.isPending}>
            {m.add}
          </Button>
          <Button type="button" variant="ghost" className="min-h-9" onClick={() => setFood(null)}>
            {m.cancel}
          </Button>
        </div>
      ) : (
        <>
          <Input
            autoFocus
            type="search"
            aria-label={m.searchFood}
            placeholder={m.searchFood}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          {matches.length === 0 && <p className="text-sm text-text-muted">{m.noMatch}</p>}
          <ul className="flex flex-col">
            {matches.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => pick(f)}
                  className="w-full rounded-sm px-2 py-1.5 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {f.name}
                  {f.brand && <span className="text-text-muted"> · {f.brand}</span>}
                </button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="ghost" className="self-start" onClick={onClose}>
            {m.cancel}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
