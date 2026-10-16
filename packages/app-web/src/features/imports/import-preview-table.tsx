import { formatCm, formatKg, formatLocalDate } from '@evully/app-core';
import type { ImportPreview, ImportPreviewRow } from '@evully/contracts';
import { Card } from '@evully/ui';
import { importErrorByCode, importMessages as m } from './messages.pt-BR';

const badge = 'rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap';

function StatusBadge({ row }: { row: ImportPreviewRow }) {
  if (row.status === 'ready') {
    return <span className={`${badge} bg-positive-soft text-positive`}>{m.status.ready}</span>;
  }
  if (row.status === 'duplicate') {
    return <span className={`${badge} bg-neutral-soft text-neutral`}>{m.status.duplicate}</span>;
  }
  return (
    <span className={`${badge} bg-caution-soft text-caution`}>
      {importErrorByCode[row.code ?? ''] ?? row.code}
    </span>
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
      <h2 className="text-lg font-semibold">{m.previewTitle}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left tabular-nums">
          <thead>
            <tr className="border-b border-border text-[13px] text-text-muted">
              <th className="px-3 py-2.5 font-semibold">{m.columns.line}</th>
              <th className="px-3 py-2.5 font-semibold">{m.columns.date}</th>
              {preview.kind === 'weights' && (
                <th className="px-3 py-2.5 font-semibold">{m.columns.time}</th>
              )}
              <th className="px-3 py-2.5 font-semibold">{m.columns.value}</th>
              <th className="px-3 py-2.5 font-semibold">{m.columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.line} className="border-b border-border/60 text-[15px]">
                <td className="px-3 py-3 text-text-muted">{row.line}</td>
                <td className="px-3 py-3">
                  {row.measuredOn ? formatLocalDate(row.measuredOn) : '—'}
                </td>
                {preview.kind === 'weights' && (
                  <td className="px-3 py-3 text-text-muted">
                    {row.time ?? (row.status === 'error' ? '—' : m.noTime)}
                  </td>
                )}
                <td className="px-3 py-3">{row.status === 'error' ? '—' : rowValues(row)}</td>
                <td className="px-3 py-3">
                  <StatusBadge row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-text-muted">
        {m.shownRows(preview.rows.length, total)} {preview.counts.errors > 0 && m.fixHint}
      </p>
    </Card>
  );
}
