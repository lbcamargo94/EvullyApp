import { formatLocalDate, useDeleteMeasurement } from '@evully/app-core';
import type { MeasurementSession, MeasurementTypeDto } from '@evully/contracts';
import {
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ShowMoreButton,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  useShowMore,
} from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { sharedMessages } from '../shared/messages.pt-BR';
import { measurementMessages as m } from './messages.pt-BR';

/** Sessions shown at first and added per "Mostrar mais". */
const STEP = 30;

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
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
  const { visible, hidden, showMore } = useShowMore(sessions, STEP);

  const confirmDelete = async () => {
    if (!pending) return;
    await remove.mutateAsync(pending.id);
    setPending(null);
  };

  return (
    <Card aria-label={m.historyTitle}>
      <h2 className="text-heading font-semibold">{m.historyTitle}</h2>
      {sessions.length === 0 ? (
        <EmptyState>{m.historyEmpty}</EmptyState>
      ) : (
        <>
          <Table className="min-w-[560px]">
            <thead>
              <tr>
                <TableHeader>{m.dateColumn}</TableHeader>
                {types.map((t) => (
                  <TableHeader key={t.id} className="text-right">
                    {t.name}
                  </TableHeader>
                ))}
                <TableHeader className="text-right">{m.actionsColumn}</TableHeader>
              </tr>
            </thead>
            <tbody>
              {visible.map((session) => {
                const date = formatLocalDate(session.measuredOn);
                const byType = new Map(session.values.map((v) => [v.measurementTypeId, v.valueCm]));
                return (
                  <TableRow key={session.id}>
                    <TableCell>{date}</TableCell>
                    {types.map((t) => {
                      const value = byType.get(t.id);
                      return (
                        <TableCell key={t.id} className="text-right">
                          {value === undefined ? '—' : decimal.format(value)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right whitespace-nowrap">
                      <IconButton label={m.edit(date)} onClick={() => onEdit(session)}>
                        <Pencil aria-hidden="true" className="size-4.5" />
                      </IconButton>
                      <IconButton label={m.remove(date)} onClick={() => setPending(session)}>
                        <Trash2 aria-hidden="true" className="size-4.5" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
          <ShowMoreButton hidden={hidden} onClick={showMore}>
            {sharedMessages.showMore(Math.min(hidden, STEP))}
          </ShowMoreButton>
          <p className="text-caption text-text-muted">{m.historyHint}</p>
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
