import { formatKg, formatLocalDate, isoToLocalTime, useDeleteWeight } from '@evully/app-core';
import type { WeightEntry } from '@evully/contracts';
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  IconButton,
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { weightMessages as m } from './messages.pt-BR';

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
      <h2 className="text-heading font-semibold">{m.historyTitle}</h2>
      {entries.length === 0 ? (
        <EmptyState>{m.historyEmpty}</EmptyState>
      ) : (
        <Table className="min-w-[560px]">
          <thead>
            <tr>
              <TableHeader>{m.columns.date}</TableHeader>
              <TableHeader>{m.columns.time}</TableHeader>
              <TableHeader>{m.columns.weight}</TableHeader>
              <TableHeader>{m.columns.tags}</TableHeader>
              <TableHeader>{m.columns.notes}</TableHeader>
              <TableHeader className="text-right">{m.columns.actions}</TableHeader>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const date = formatLocalDate(entry.measuredOn);
              return (
                <TableRow key={entry.id}>
                  <TableCell>{date}</TableCell>
                  <TableCell className="text-text-muted">
                    {isoToLocalTime(entry.measuredAt)}
                  </TableCell>
                  <TableCell className="font-semibold">{formatKg(entry.weightKg)}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap gap-1">
                      {entry.tags.map((t) => (
                        <Badge key={t.id} tone="caution" size="sm">
                          {t.name}
                        </Badge>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-text-muted">{entry.notes ?? '—'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <IconButton label={m.edit(date)} onClick={() => onEdit(entry)}>
                      <Pencil aria-hidden="true" className="size-4.5" />
                    </IconButton>
                    <IconButton label={m.remove(date)} onClick={() => setPending(entry)}>
                      <Trash2 aria-hidden="true" className="size-4.5" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
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
