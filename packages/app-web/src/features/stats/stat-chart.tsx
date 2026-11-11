import { formatLocalDate, type periodStart } from '@evully/app-core';
import { Card, EmptyState } from '@evully/ui';
import type { ReactNode } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statsMessages as m } from './messages.pt-BR';

export type From = ReturnType<typeof periodStart>;

export type StatRow = { date: string } & Record<string, number | string | null>;

export interface StatSeries {
  key: string;
  name: string;
  /**
   * `dots`: one point per record; `line`: the highlighted line; `connected`:
   * a line with a mark on each record; `target`: dashed step line.
   */
  kind: 'bar' | 'line' | 'connected' | 'dots' | 'target';
}

const COLORS: Record<StatSeries['kind'], string> = {
  bar: 'var(--color-brand)',
  line: 'var(--color-brand)',
  connected: 'var(--color-brand)',
  dots: 'var(--color-neutral)',
  target: 'var(--color-text-muted)',
};

const shortDate = (date: string) => formatLocalDate(date).slice(0, 5);

/** First and last value of each plotted series, for the text alternative (DESIGN.md §7). */
function seriesSummary(
  data: StatRow[],
  series: StatSeries[],
  format: (value: number) => string,
): string[] {
  return series.flatMap((s) => {
    const values = data.filter((row) => typeof row[s.key] === 'number');
    const first = values[0];
    const last = values.at(-1);
    if (!first || !last) return [];
    const point = (row: StatRow) => `${format(Number(row[s.key]))} (${shortDate(row.date)})`;
    return [m.chartSeries(s.name, point(first), point(last))];
  });
}

function renderSeries(s: StatSeries) {
  const common = { dataKey: s.key, name: s.name, isAnimationActive: false };
  if (s.kind === 'bar')
    return <Bar key={s.key} {...common} fill={COLORS.bar} radius={[3, 3, 0, 0]} />;
  if (s.kind === 'dots') {
    return (
      <Line
        key={s.key}
        {...common}
        stroke="transparent"
        dot={{ r: 3, fill: COLORS.dots, stroke: 'none' }}
      />
    );
  }
  if (s.kind === 'target') {
    return (
      <Line
        key={s.key}
        {...common}
        type="stepAfter"
        stroke={COLORS.target}
        strokeWidth={2}
        strokeDasharray="6 4"
        dot={false}
        connectNulls
      />
    );
  }
  const dot = s.kind === 'connected' ? { r: 3, fill: COLORS.connected, stroke: 'none' } : false;
  return (
    <Line key={s.key} {...common} stroke={COLORS.line} strokeWidth={3} dot={dot} connectNulls />
  );
}

/** One statistic over time (README §13.2), with a legend and a text alternative. */
export function StatChart({
  id,
  title,
  hint,
  action,
  data,
  series,
  format,
  axisFormat = format,
  weekly = false,
  zeroLine = false,
  fromZero = false,
  integer = false,
}: {
  id: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  data: StatRow[];
  series: StatSeries[];
  format: (value: number) => string;
  axisFormat?: (value: number) => string;
  /** Rows are weeks: the tooltip says "Semana de …". */
  weekly?: boolean;
  zeroLine?: boolean;
  fromZero?: boolean;
  /** Counts: the axis has no fractions. */
  integer?: boolean;
}) {
  return (
    <Card aria-labelledby={id} className="min-w-0 gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col">
          <h2 id={id} className="text-lg font-semibold">
            {title}
          </h2>
          {hint && <p className="text-sm text-text-muted">{hint}</p>}
        </div>
        {action}
      </div>
      {data.length === 0 ? (
        <EmptyState className="py-12">{m.emptyPeriod}</EmptyState>
      ) : (
        <figure className="m-0">
          <div
            role="img"
            aria-label={m.chartAlt(title, data.length, seriesSummary(data, series, format))}
            className="h-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDate}
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={fromZero ? [0, 'auto'] : ['auto', 'auto']}
                  allowDecimals={!integer}
                  tickFormatter={axisFormat}
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                  tickLine={false}
                  width={48}
                />
                {zeroLine && <ReferenceLine y={0} stroke="var(--color-text-muted)" />}
                <Tooltip
                  formatter={(value, name) => [format(Number(value)), String(name)]}
                  labelFormatter={(date) => {
                    const day = formatLocalDate(String(date));
                    return weekly ? m.weekOf(day) : day;
                  }}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: 'var(--color-text)',
                  }}
                />
                {series.map(renderSeries)}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="flex flex-wrap gap-4 pt-3 text-[13px] text-text-muted">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={
                    s.kind === 'dots'
                      ? 'size-2 rounded-full bg-neutral'
                      : s.kind === 'target'
                        ? 'h-0.5 w-4.5 border-t-2 border-dashed border-text-muted'
                        : 'h-0.75 w-4.5 rounded-full bg-brand'
                  }
                />
                {s.name}
              </span>
            ))}
          </figcaption>
        </figure>
      )}
    </Card>
  );
}
