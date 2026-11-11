import { addDays, formatKg, formatLocalDate, localToday } from '@evully/app-core';
import type { WeightSummary } from '@evully/contracts';
import { Card, EmptyState } from '@evully/ui';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { weightMessages as m } from './messages.pt-BR';

type Period = keyof typeof m.periods;
type Point = WeightSummary['series'][number];

const shortDate = (date: string) => formatLocalDate(date).slice(0, 5);

/** Plain dot for each day; ringed in the caution color when the day has a tag. */
function renderDailyDot(props: object) {
  const { cx, cy, payload, index } = props as {
    cx?: number;
    cy?: number;
    payload?: Point;
    index?: number;
  };
  const tagged = payload?.tagged ?? false;
  return (
    <circle
      key={index}
      cx={cx}
      cy={cy}
      r={tagged ? 6 : 3.5}
      fill={tagged ? 'none' : 'var(--color-neutral)'}
      stroke={tagged ? 'var(--color-caution)' : 'none'}
      strokeWidth={2}
    />
  );
}

function filterSeries(series: Point[], period: Period, projectStart: string | null): Point[] {
  if (period === 'all') return series;
  const from = period === 'days30' ? addDays(localToday(), -29) : projectStart;
  return from ? series.filter((p) => p.date >= from) : series;
}

/** Daily weight as dots, 7-day trend as the highlighted line, tagged days ringed (DESIGN.md §7). */
export function WeightChart({
  summary,
  projectStart,
}: {
  summary: WeightSummary;
  projectStart: string | null;
}) {
  const [period, setPeriod] = useState<Period>(projectStart ? 'project' : 'all');
  const data = filterSeries(summary.series, period, projectStart);
  const first = data[0];
  const last = data.at(-1);

  return (
    <Card aria-label={m.chartTitle} className="min-w-0 flex-[2_1_480px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{m.chartTitle}</h2>
        <div
          role="group"
          aria-label={m.periodLabel}
          className="flex gap-1 rounded-md bg-surface-muted p-1"
        >
          {(Object.keys(m.periods) as Period[])
            .filter((p) => p !== 'project' || projectStart)
            .map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={
                  period === p
                    ? 'min-h-8 rounded-sm bg-surface px-3 text-[13px] font-semibold shadow-sm'
                    : 'min-h-8 rounded-sm px-3 text-[13px] font-semibold text-text-muted'
                }
              >
                {m.periods[p]}
              </button>
            ))}
        </div>
      </div>

      {data.length === 0 || !first || !last ? (
        <EmptyState className="py-16">{m.chartEmpty}</EmptyState>
      ) : (
        <figure className="m-0">
          <div
            role="img"
            aria-label={m.chartAlt(
              data.length,
              m.chartPoint(formatKg(first.weightKg), formatLocalDate(first.date)),
              m.chartPoint(formatKg(last.weightKg), formatLocalDate(last.date)),
            )}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tickFormatter={(v: number) => Math.round(v).toString()}
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value, name) => [formatKg(Number(value)), String(name)]}
                  labelFormatter={(date) => formatLocalDate(String(date))}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: 'var(--color-text)',
                  }}
                />
                <Line
                  name={m.legendDaily}
                  dataKey="weightKg"
                  stroke="transparent"
                  isAnimationActive={false}
                  dot={renderDailyDot}
                />
                <Line
                  name={m.legendTrend}
                  dataKey="trend"
                  stroke="var(--color-brand)"
                  strokeWidth={3}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="flex flex-wrap gap-4 pt-3 text-[13px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-neutral" aria-hidden="true" />
              {m.legendDaily}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.75 w-4.5 rounded-full bg-brand" aria-hidden="true" />
              {m.legendTrend}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2 border-caution" aria-hidden="true" />
              {m.legendTagged}
            </span>
          </figcaption>
        </figure>
      )}
    </Card>
  );
}
