import { errorCode, useMealTemplates, useRemoveMealTemplate } from '@evully/app-core';
import type { MealTemplateDto } from '@evully/contracts';
import { Button, Card, ConfirmDialog, EmptyState } from '@evully/ui';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { dietMessages as m, foodLogErrorByCode, formatNumber, unitLabels } from './messages.pt-BR';

/** Favorite meals of the profile (README §9.5). */
export function FavoritesList({ profileId }: { profileId: string }) {
  const { data: templates = [] } = useMealTemplates(profileId);
  const remove = useRemoveMealTemplate(profileId);
  const [pending, setPending] = useState<MealTemplateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(foodLogErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-3xl text-text-muted">{m.favoritesHint}</p>
      {templates.length === 0 && <EmptyState>{m.favoritesEmpty}</EmptyState>}
      {templates.map((t) => (
        <Card key={t.id} aria-label={t.name} className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              {t.name}
              <span className="ml-2 text-sm font-normal text-text-muted tabular-nums">
                {m.kcalApprox(formatNumber(Math.round(t.caloriesKcal)))}
              </span>
            </h3>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-2"
              aria-label={m.removeFavorite(t.name)}
              onClick={() => setPending(t)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <p className="text-sm text-text-muted">
            {t.items
              .map((i) => `${i.foodName} ${formatNumber(i.quantity)} ${unitLabels[i.unit]}`)
              .join(' · ')}
          </p>
        </Card>
      ))}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.removeFavoriteTitle}
        description={m.removeFavoriteBody(pending?.name ?? '')}
        confirmLabel={m.removeFavoriteConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
