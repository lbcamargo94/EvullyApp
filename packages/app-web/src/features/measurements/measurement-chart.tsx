import { changeTone, formatChange, formatCm, formatLocalDate } from '@evully/app-core';
import type { MeasurementSummary } from '@evully/contracts';
import { Card, NativeSelect, TrendBadge } from '@evully/ui';
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
import { measurementMessages as m } from './messages.pt-BR';

const shortDate = (date: string) => formatLocalDate(date).slice(0, 5);

/** One tracked measurement over time, chosen with a selector (README §8.6). */
export function MeasurementChart({ summary }: { summary: MeasurementSummary }) {
  const [selectedId, setSelectedId] = useState(summary.items[0]?.id ?? '');
  const item = summary.items.find((i) => i.id === selectedId) ?? summary.items[0];
  if (!item) return null;

  return (
    <Card aria-label={m.chartTitle} className="min-w-0 flex-[2_1_440px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{m.chartTitle}</h2>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          {m.chooseMeasure}
          <NativeSelect
            value={item.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-auto"
          >
            {summary.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      {item.series.length === 0 ? (
        <p className="py-16 text-center text-text-muted">{m.chartEmpty}</p>
      ) : (
        <div role="img" aria-label={m.chartAlt(item.name, item.series.length)} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
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
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(v: number) => Math.round(v).toString()}
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickLine={false}
                width={36}
              />
              <Tooltip
                formatter={(value) => [formatCm(Number(value)), item.name]}
                labelFormatter={(date) => formatLocalDate(String(date))}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  color: 'var(--color-text)',
                }}
              />
              <Line
                dataKey="valueCm"
                stroke="var(--color-brand)"
                strokeWidth={3}
                dot={{ r: 3.5, fill: 'var(--color-brand)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted tabular-nums">
        {item.current && (
          <span>
            {m.current} <strong className="text-text">{formatCm(item.current.valueCm)}</strong>
          </span>
        )}
        {item.start && (
          <span>
            {summary.objective ? m.start : m.firstValue}{' '}
            <strong className="text-text">{formatCm(item.start.valueCm)}</strong>
          </span>
        )}
        {item.change !== null && (
          <span className="flex items-center gap-2">
            {m.change}
            <TrendBadge tone={changeTone(item.change, item.bodyRegion, summary.objective)}>
              {formatChange(item.change, 'cm')}
            </TrendBadge>
          </span>
        )}
      </div>
    </Card>
  );
}
