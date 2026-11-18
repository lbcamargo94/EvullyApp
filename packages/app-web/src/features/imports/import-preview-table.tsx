import { formatCm, formatKg, formatLocalDate } from '@evully/app-core';
import type { ImportPreview, ImportPreviewRow } from '@evully/contracts';
import { Badge, Card, Table, TableCell, TableHeader, TableRow } from '@evully/ui';
import { importErrorByCode, importMessages as m } from './messages.pt-BR';

function StatusBadge({ row }: { row: ImportPreviewRow }) {
  if (row.status === 'ready')
    return (
      <Badge tone="positive" size="sm" className="whitespace-nowrap">
        {m.status.ready}
      </Badge>
    );
  if (row.status === 'duplicate')
    return (
      <Badge tone="neutral" size="sm" className="whitespace-nowrap">
        {m.status.duplicate}
      </Badge>
    );
  return (
    <Badge tone="caution" size="sm" className="whitespace-nowrap">
      {importErrorByCode[row.code ?? ''] ?? row.code}
    </Badge>
  );
}

function rowValues(row: ImportPreviewRow): string {
  if (row.weightKg !== null) return formatKg(row.weightKg);
  return row.values.map((v) => `${v.name} ${formatCm(v.valueCm)}`).join(' · ') || '—';
}

export function ImportPreviewTable({ preview }: { preview: ImportPreview }) {
  const total = preview.counts.ready + preview.counts.duplicates + preview.counts.errors;
  return (
    <Card aria-label={m.previewTitle}>
      <h2 className="text-heading font-semibold">{m.previewTitle}</h2>
      <Table className="min-w-[600px]">
        <thead>
          <tr>
            <TableHeader>{m.columns.line}</TableHeader>
            <TableHeader>{m.columns.date}</TableHeader>
            {preview.kind === 'weights' && <TableHeader>{m.columns.time}</TableHeader>}
            <TableHeader>{m.columns.value}</TableHeader>
            <TableHeader>{m.columns.status}</TableHeader>
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row) => (
            <TableRow key={row.line}>
              <TableCell className="text-text-muted">{row.line}</TableCell>
              <TableCell>{row.measuredOn ? formatLocalDate(row.measuredOn) : '—'}</TableCell>
              {preview.kind === 'weights' && (
                <TableCell className="text-text-muted">
                  {row.time ?? (row.status === 'error' ? '—' : m.noTime)}
                </TableCell>
              )}
              <TableCell>{row.status === 'error' ? '—' : rowValues(row)}</TableCell>
              <TableCell>
                <StatusBadge row={row} />
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      <p className="text-sm text-text-muted">
        {m.shownRows(preview.rows.length, total)} {preview.counts.errors > 0 && m.fixHint}
      </p>
    </Card>
  );
}
