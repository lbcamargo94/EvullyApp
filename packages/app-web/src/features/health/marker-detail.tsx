import {
  analyteByCode,
  markerLevel,
  markerTrend,
  type MarkerHistory,
  type MarkerPoint,
} from '@evully/app-core';
import { Badge, Card, Table, TableCell, TableHeader, TableRow } from '@evully/ui';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  flagLabels,
  formatExamDate,
  formatReference,
  formatShortDate,
  formatValue,
  levelHints,
  levelLabels,
  markerMessages as m,
  markerQuestions,
  trendLabels,
} from './messages.pt-BR';

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-text)',
};

/** The series in the unit of its last result: values in other units are not comparable. */
function MarkerChart({ history }: { history: MarkerHistory }) {
  const last = history.points.at(-1);
  if (!last) return null;
  const points = history.points.filter((p) => p.unit === last.unit);
  const first = points[0] ?? last;
  const alt = m.chartAlt(
    history.name,
    points.length,
    `${formatValue(first.value)} ${first.unit} (${formatExamDate(first.collectedOn)})`,
    `${formatValue(last.value)} ${last.unit} (${formatExamDate(last.collectedOn)})`,
  );
  return (
    <>
      <div role="img" aria-label={alt} className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="collectedOn"
              tickFormatter={formatShortDate}
              stroke="var(--color-text-muted)"
              fontSize={12}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => formatValue(v)}
              stroke="var(--color-text-muted)"
              fontSize={12}
              tickLine={false}
              width={44}
            />
            {last.referenceMin !== null && (
              <ReferenceLine
                y={last.referenceMin}
                stroke="var(--color-text-muted)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
            )}
            {last.referenceMax !== null && (
              <ReferenceLine
                y={last.referenceMax}
                stroke="var(--color-text-muted)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
            )}
            <Tooltip
              formatter={(value) => [`${formatValue(Number(value))} ${last.unit}`, history.name]}
              labelFormatter={(date) => formatExamDate(String(date))}
              contentStyle={tooltipStyle}
            />
            <Line
              dataKey="value"
              stroke="var(--color-brand)"
              strokeWidth={3}
              dot={{ r: 3.5, fill: 'var(--color-brand)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {points.length < history.points.length && (
        <p className="text-caption text-text-muted">{m.chartOnlyUnit(last.unit)}</p>
      )}
    </>
  );
}

function HistoryTable({ points }: { points: MarkerPoint[] }) {
  return (
    <div className="overflow-x-auto">
      <Table aria-label={m.historyTable} className="min-w-[420px]">
        <thead>
          <tr>
            <TableHeader>{m.date}</TableHeader>
            <TableHeader>{m.value}</TableHeader>
            <TableHeader>{m.reference}</TableHeader>
            <TableHeader>{m.position}</TableHeader>
          </tr>
        </thead>
        <tbody>
          {[...points].reverse().map((p) => (
            <TableRow key={p.examId}>
              <TableCell>{formatExamDate(p.collectedOn)}</TableCell>
              <TableCell className="font-semibold tabular-nums">
                {formatValue(p.value)} {p.unit}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatReference({ ...p, referenceText: null }) ?? '—'}
              </TableCell>
              <TableCell>{flagLabels[p.flag] ?? '—'}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/** One marker: chart, what it is, every result and questions for the consultation. */
export function MarkerDetail({ history }: { history: MarkerHistory }) {
  const level = markerLevel(history.points);
  const trend = markerTrend(history.points);
  const about = history.analyteCode ? analyteByCode(history.analyteCode)?.about : undefined;
  const trendLabel = trendLabels[trend];

  return (
    <Card aria-labelledby="marker-detail-title" className="min-w-0 flex-[2_1_440px] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="marker-detail-title" className="flex-1 text-heading font-semibold">
          {m.chartTitle(history.name)}
        </h2>
        <Badge tone={level === 'informative' ? 'neutral' : 'caution'}>{levelLabels[level]}</Badge>
        {trendLabel && <Badge tone="neutral">{trendLabel}</Badge>}
      </div>
      <p className="text-caption text-text-muted">{levelHints[level]}</p>
      <MarkerChart history={history} />
      <section aria-labelledby="marker-about" className="flex flex-col gap-1">
        <h3 id="marker-about" className="text-body font-semibold">
          {m.about}
        </h3>
        <p className="text-body">{about ?? m.aboutCustom}</p>
      </section>
      <HistoryTable points={history.points} />
      <section aria-labelledby="marker-questions" className="flex flex-col gap-2">
        <h3 id="marker-questions" className="text-body font-semibold">
          {m.questions}
        </h3>
        <p className="text-caption text-text-muted">{m.questionsHint}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {markerQuestions(history.name, level, trend).map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
