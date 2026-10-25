import {
  addDays,
  errorCode,
  localToday,
  useApplyMealTemplate,
  useCopyMeal,
  useMealTemplates,
  useSaveMealTemplate,
} from '@evully/app-core';
import type { MealType } from '@evully/contracts';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  NativeSelect,
} from '@evully/ui';
import { Ellipsis } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { MealKey } from './meal-section';
import { dietMessages as m, foodLogErrorByCode, formatNumber, mealLabels } from './messages.pt-BR';

type Panel = 'copy' | 'save' | 'apply' | null;

const errorText = (e: unknown) => foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError;

/** Shortcuts of a meal (README §9.5): repeat yesterday, copy, save and use favorites. */
export function MealActions({
  profileId,
  date,
  meal,
  title,
  hasItems,
  yesterdayHasItems,
  onMessage,
}: {
  profileId: string;
  date: string;
  meal: MealKey;
  title: string;
  hasItems: boolean;
  yesterdayHasItems: boolean;
  onMessage: (message: { ok: boolean; text: string }) => void;
}) {
  const copy = useCopyMeal(profileId);
  const { data: templates = [] } = useMealTemplates(profileId);
  const [panel, setPanel] = useState<Panel>(null);
  const close = () => setPanel(null);

  const repeatYesterday = async () => {
    try {
      const from = { date: addDays(date as ReturnType<typeof localToday>, -1), ...meal };
      await copy.mutateAsync({ from, to: { date, ...meal } });
      onMessage({ ok: true, text: m.copied });
    } catch (e) {
      onMessage({ ok: false, text: errorText(e) });
    }
  };

  const hasActions = yesterdayHasItems || hasItems || templates.length > 0;
  return (
    <>
      {hasActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.mealActions(title)}
            >
              <Ellipsis aria-hidden="true" className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {yesterdayHasItems && (
              <DropdownMenuItem onSelect={() => void repeatYesterday()}>
                {m.repeatYesterday}
              </DropdownMenuItem>
            )}
            {hasItems && (
              <DropdownMenuItem onSelect={() => setPanel('copy')}>{m.copyTo}</DropdownMenuItem>
            )}
            {hasItems && (
              <DropdownMenuItem onSelect={() => setPanel('save')}>
                {m.saveFavorite}
              </DropdownMenuItem>
            )}
            {templates.length > 0 && (
              <DropdownMenuItem onSelect={() => setPanel('apply')}>
                {m.useFavorite}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {panel === 'copy' && (
        <CopyPanel
          profileId={profileId}
          date={date}
          meal={meal}
          onDone={onMessage}
          onClose={close}
        />
      )}
      {panel === 'save' && (
        <SavePanel
          profileId={profileId}
          date={date}
          meal={meal}
          defaultName={title}
          onDone={onMessage}
          onClose={close}
        />
      )}
      {panel === 'apply' && (
        <ApplyPanel
          profileId={profileId}
          date={date}
          meal={meal}
          onDone={onMessage}
          onClose={close}
        />
      )}
    </>
  );
}

interface PanelProps {
  profileId: string;
  date: string;
  meal: MealKey;
  onDone: (message: { ok: boolean; text: string }) => void;
  onClose: () => void;
}

const panelClass = 'flex w-full flex-wrap items-end gap-2 rounded-md bg-surface-muted p-3';
const STANDARD = Object.keys(mealLabels) as Exclude<MealType, 'custom'>[];

function CopyPanel({ profileId, date, meal, onDone, onClose }: PanelProps) {
  const copy = useCopyMeal(profileId);
  const today = localToday();
  const [target, setTarget] = useState({
    date: addDays(date as typeof today, 1) as string,
    meal: 'same',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const to =
      target.meal === 'same'
        ? { date: target.date, ...meal }
        : { date: target.date, mealType: target.meal as MealType, mealName: null };
    try {
      await copy.mutateAsync({ from: { date, ...meal }, to });
      onDone({ ok: true, text: m.copied });
      onClose();
    } catch (err) {
      onDone({ ok: false, text: errorText(err) });
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={panelClass} aria-label={m.copyTitle}>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {m.copyDate}
        <Input
          type="date"
          max={addDays(today, 30)}
          value={target.date}
          onChange={(e) => setTarget((t) => ({ ...t, date: e.target.value }))}
          className="min-h-9"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {m.copyMeal}
        <NativeSelect
          value={target.meal}
          onChange={(e) => setTarget((t) => ({ ...t, meal: e.target.value }))}
          className="min-h-9"
        >
          <option value="same">
            {meal.mealType === 'custom'
              ? m.copySameCustom(meal.mealName ?? '')
              : mealLabels[meal.mealType]}
          </option>
          {STANDARD.filter((t) => t !== meal.mealType).map((t) => (
            <option key={t} value={t}>
              {mealLabels[t]}
            </option>
          ))}
        </NativeSelect>
      </label>
      <Button type="submit" className="min-h-9" disabled={copy.isPending}>
        {m.copyConfirm}
      </Button>
      <Button type="button" variant="ghost" className="min-h-9" onClick={onClose}>
        {m.cancel}
      </Button>
    </form>
  );
}

function SavePanel({
  profileId,
  date,
  meal,
  defaultName,
  onDone,
  onClose,
}: PanelProps & { defaultName: string }) {
  const save = useSaveMealTemplate(profileId);
  const [name, setName] = useState(defaultName);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const saved = await save.mutateAsync({ date, ...meal, name });
      onDone({ ok: true, text: m.favoriteSaved(saved.name) });
      onClose();
    } catch (err) {
      onDone({ ok: false, text: errorText(err) });
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className={panelClass}>
      <Input
        autoFocus
        aria-label={m.favoriteName}
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="min-h-9 max-w-64 flex-1"
      />
      <Button type="submit" className="min-h-9" disabled={save.isPending}>
        {m.favoriteSave}
      </Button>
      <Button type="button" variant="ghost" className="min-h-9" onClick={onClose}>
        {m.cancel}
      </Button>
    </form>
  );
}

function ApplyPanel({ profileId, date, meal, onDone, onClose }: PanelProps) {
  const { data: templates = [] } = useMealTemplates(profileId);
  const apply = useApplyMealTemplate(profileId);

  const use = async (templateId: string) => {
    try {
      await apply.mutateAsync({ templateId, date, ...meal });
      onDone({ ok: true, text: m.plannedHint });
      onClose();
    } catch (err) {
      onDone({ ok: false, text: errorText(err) });
    }
  };

  return (
    <div className={panelClass}>
      <ul className="flex w-full flex-col">
        {templates.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              disabled={apply.isPending}
              onClick={() => void use(t.id)}
              aria-label={m.applyFavorite(t.name)}
              className="flex w-full justify-between gap-3 rounded-sm px-2 py-1.5 text-left hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
            >
              <span>{t.name}</span>
              <span className="text-sm text-text-muted tabular-nums">
                {m.kcalApprox(formatNumber(Math.round(t.caloriesKcal)))}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" className="min-h-9" onClick={onClose}>
        {m.cancel}
      </Button>
    </div>
  );
}
