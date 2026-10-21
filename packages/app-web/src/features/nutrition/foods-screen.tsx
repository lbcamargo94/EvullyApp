import { useFoods } from '@evully/app-core';
import type { FoodDto } from '@evully/contracts';
import { useState } from 'react';
import { FoodForm } from './food-form';
import { FoodList } from './food-list';
import { foodMessages as m } from './messages.pt-BR';

/** Household food catalog (README §9.2, §9.5). */
export function FoodsScreen() {
  const { data: foods = [] } = useFoods();
  const [editing, setEditing] = useState<FoodDto | null>(null);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-semibold">{m.title}</h1>
        <p className="max-w-3xl text-text-muted">{m.subtitle}</p>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <FoodForm key={editing?.id ?? 'new'} editing={editing} onDone={() => setEditing(null)} />
        <FoodList foods={foods} onEdit={setEditing} />
      </div>
    </>
  );
}
