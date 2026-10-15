import { formatKg, formatLocalDate, isoToLocalTime, useDeleteWeight } from '@evully/app-core';
import type { WeightEntry } from '@evully/contracts';
import { Card, ConfirmDialog } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { weightMessages as m } from './messages.pt-BR';

const iconButton =
  'inline-flex size-9 items-center justify-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-brand';

export function WeightHistory({
  profileId,
  entries,
  onEdit,
}: {
  profileId: string;
  entries: WeightEntry[];
  onEdit: (entry: WeightEntry) => void;
}) {
  const remove = useDeleteWeight(profileId);
  const [pending, setPending] = useState<WeightEntry | null>(null);

  const confirmDelete = async () => {
    if (!pending) return;
    await remove.mutateAsync(pending.id);
    setPending(null);
  };

  return (
    <Card aria-label={m.historyTitle}>
      <h2 className="text-lg font-semibold">{m.historyTitle}</h2>
      {entries.length === 0 ? (
        <p className="text-text-muted">{m.historyEmpty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left tabular-nums">
            <thead>
              <tr className="border-b border-border text-[13px] text-text-muted">
                <th className="px-3 py-2.5 font-semibold">{m.columns.date}</th>
                <th className="px-3 py-2.5 font-semibold">{m.columns.time}</th>
                <th className="px-3 py-2.5 font-semibold">{m.columns.weight}</th>
                <th className="px-3 py-2.5 font-semibold">{m.columns.tags}</th>
                <th className="px-3 py-2.5 font-semibold">{m.columns.notes}</th>
                <th className="px-3 py-2.5 text-right font-semibold">{m.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const date = formatLocalDate(entry.measuredOn);
                return (
                  <tr key={entry.id} className="border-b border-border/60 text-[15px]">
                    <td className="px-3 py-3">{date}</td>
                    <td className="px-3 py-3 text-text-muted">
                      {isoToLocalTime(entry.measuredAt)}
                    </td>
                    <td className="px-3 py-3 font-semibold">{formatKg(entry.weightKg)}</td>
                    <td className="px-3 py-3">
                      <span className="flex flex-wrap gap-1">
                        {entry.tags.map((t) => (
                          <span
                            key={t.id}
                            className="rounded-full bg-caution-soft px-2 py-0.5 text-xs font-semibold text-caution"
                          >
                            {t.name}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-muted">{entry.notes ?? '—'}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={m.edit(date)}
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil aria-hidden="true" className="size-4.5" />
                      </button>
                      <button
                        type="button"
                        className={iconButton}
                        aria-label={m.remove(date)}
                        onClick={() => setPending(entry)}
                      >
                        <Trash2 aria-hidden="true" className="size-4.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.confirmTitle}
        description={
          pending
            ? m.confirmBody(formatLocalDate(pending.measuredOn), formatKg(pending.weightKg))
            : ''
        }
        confirmLabel={m.confirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
