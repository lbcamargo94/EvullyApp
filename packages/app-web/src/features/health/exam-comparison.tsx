import { compareExams, type MarkerPoint } from '@evully/app-core';
import type { HealthExamDto } from '@evully/contracts';
import {
  Card,
  EmptyState,
  NativeSelect,
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@evully/ui';
import { useState } from 'react';
import {
  compareMessages as m,
  flagLabels,
  formatDifference,
  formatExamDate,
  formatValue,
} from './messages.pt-BR';

const valueOf = (p: MarkerPoint | null) => {
  if (!p) return m.missing;
  const flag = p.flag === 'below' || p.flag === 'above' ? ` · ${flagLabels[p.flag]}` : '';
  return `${formatValue(p.value)} ${p.unit}${flag}`;
};

function ExamSelect({
  label,
  exams,
  value,
  onChange,
}: {
  label: string;
  exams: HealthExamDto[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-caption text-text-muted">
      {label}
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {exams.map((e) => (
          <option key={e.id} value={e.id}>
            {formatExamDate(e.collectedOn)}
            {e.laboratory ? ` · ${e.laboratory}` : ''}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

/** Two exams side by side (README §24.3); `exams` come newest first. */
export function ExamComparison({ exams }: { exams: HealthExamDto[] }) {
  const [firstId, setFirstId] = useState(exams[1]?.id ?? '');
  const [secondId, setSecondId] = useState(exams[0]?.id ?? '');
  const first = exams.find((e) => e.id === firstId) ?? exams[1];
  const second = exams.find((e) => e.id === secondId) ?? exams[0];

  if (!first || !second)
    return (
      <Card>
        <EmptyState title={m.needTwoTitle}>{m.needTwo}</EmptyState>
      </Card>
    );

  const rows = first.id === second.id ? [] : compareExams(first, second);
  const [older, newer] =
    first.collectedOn <= second.collectedOn ? [first, second] : [second, first];

  return (
    <Card aria-labelledby="compare-title" className="gap-4">
      <h2 id="compare-title" className="text-heading font-semibold">
        {m.title}
      </h2>
      <div className="flex flex-wrap gap-4">
        <ExamSelect label={m.first} exams={exams} value={first.id} onChange={setFirstId} />
        <ExamSelect label={m.second} exams={exams} value={second.id} onChange={setSecondId} />
      </div>
      {first.id === second.id ? (
        <p className="text-body text-text-muted">{m.sameExam}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table aria-label={m.title} className="min-w-[520px]">
            <thead>
              <tr>
                <TableHeader>{m.marker}</TableHeader>
                <TableHeader>{formatExamDate(older.collectedOn)}</TableHeader>
                <TableHeader>{formatExamDate(newer.collectedOn)}</TableHeader>
                <TableHeader>{m.difference}</TableHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell className="tabular-nums">{valueOf(r.before)}</TableCell>
                  <TableCell className="tabular-nums">{valueOf(r.after)}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.difference !== null
                      ? formatDifference(r.difference)
                      : r.before && r.after
                        ? m.noDifference
                        : m.missing}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <p className="text-caption text-text-muted">{m.hint}</p>
    </Card>
  );
}
