import { formatLocalDate, useDeleteMeasurement } from '@evully/app-core';
import type { MeasurementSession, MeasurementTypeDto } from '@evully/contracts';
import { Card, ConfirmDialog, EmptyState } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { measurementMessages as m } from './messages.pt-BR';

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const iconButton =
  'inline-flex size-9 items-center justify-center rounded-sm text-text-muted hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-brand';

/** Sessions as rows, tracked measurements as columns. */
export function MeasurementHistory({
  profileId,
  types,
  sessions,
  onEdit,
}: {
  profileId: string;
  types: MeasurementTypeDto[];
  sessions: MeasurementSession[];
  onEdit: (session: MeasurementSession) => void;
}) {
  const remove = useDeleteMeasurement(profileId);
  const [pending, setPending] = useState<MeasurementSession | null>(null);

  const confirmDelete = async () => {
    if (!pending) return;
    await remove.mutateAsync(pending.id);
    setPending(null);
  };

  return (
    <Card aria-label={m.historyTitle}>
      <h2 className="text-lg font-semibold">{m.historyTitle}</h2>
      {sessions.length === 0 ? (
        <EmptyState>{m.historyEmpty}</EmptyState>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse tabular-nums">
              <thead>
                <tr className="border-b border-border text-[13px] text-text-muted">
                  <th className="px-3 py-2.5 text-left font-semibold">{m.dateColumn}</th>
                  {types.map((t) => (
                    <th key={t.id} className="px-3 py-2.5 text-right font-semibold">
                      {t.name}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-semibold">{m.actionsColumn}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const date = formatLocalDate(session.measuredOn);
                  const byType = new Map(
                    session.values.map((v) => [v.measurementTypeId, v.valueCm]),
                  );
                  return (
                    <tr key={session.id} className="border-b border-border/60 text-[15px]">
                      <td className="px-3 py-3">{date}</td>
                      {types.map((t) => {
                        const value = byType.get(t.id);
                        return (
                          <td key={t.id} className="px-3 py-3 text-right">
                            {value === undefined ? '—' : decimal.format(value)}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={m.edit(date)}
                          onClick={() => onEdit(session)}
                        >
                          <Pencil aria-hidden="true" className="size-4.5" />
                        </button>
                        <button
                          type="button"
                          className={iconButton}
                          aria-label={m.remove(date)}
                          onClick={() => setPending(session)}
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
          <p className="text-sm text-text-muted">{m.historyHint}</p>
        </>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.confirmTitle}
        description={pending ? m.confirmBody(formatLocalDate(pending.measuredOn)) : ''}
        confirmLabel={m.confirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </Card>
  );
}
