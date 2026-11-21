import {
  changeTone,
  formatChange,
  formatCm,
  formatKg,
  measurementComparison,
  weightComparison,
  ANALYTICS_WINDOWS,
  type AnalyticsWindow,
  type LocalDate,
} from '@evully/app-core';
import type { MeasurementSummary, Objective, WeightSummary } from '@evully/contracts';
import { Card, SegmentedControl, Table, TableHeader, TrendIndicator } from '@evully/ui';
import { useState } from 'react';
import { Missing, Row } from './comparison-table';
import { comparisonMessages as m } from './messages.pt-BR';
import { TrainingDetail, TrainingRows, type TrainingData } from './training-comparison';

type Indicator = Parameters<typeof changeTone>[1];

const DEFAULT_WINDOW: AnalyticsWindow = 30;

/** A colored change, or a dash when there is not enough data for it. */
function Change({
  value,
  unit,
  indicator,
  objective,
  suffix = '',
}: {
  value: number | null;
  unit: 'kg' | 'cm';
  indicator: Indicator;
  objective: Objective | null;
  suffix?: string | undefined;
}) {
  if (value === null) return <Missing />;
  const text = formatChange(value, unit);
  return (
    <TrendIndicator tone={changeTone(value, indicator, objective)}>
      {text === 'Estável' ? text : `${text}${suffix}`}
    </TrendIndicator>
  );
}

const kg = (value: number | null) => (value === null ? <Missing /> : formatKg(value));

function WeightRows({
  summary,
  days,
  today,
  objective,
}: {
  summary: WeightSummary;
  days: AnalyticsWindow;
  today: LocalDate;
  objective: Objective | null;
}) {
  const points = summary.series.map((p) => ({ date: p.date, value: p.weightKg }));
  const { current, previous } = weightComparison(points, days, today);
  const change = (value: number | null, suffix?: string) => (
    <Change value={value} unit="kg" indicator="weight" objective={objective} suffix={suffix} />
  );
  return (
    <>
      <Row
        label={m.weighedDays}
        current={m.daysOf(current.days, days)}
        previous={m.daysOf(previous.days, days)}
      />
      <Row
        label={m.averageWeight}
        current={kg(current.averageKg)}
        previous={kg(previous.averageKg)}
      />
      <Row label={m.trendWeight} current={kg(current.trendKg)} previous={kg(previous.trendKg)} />
      <Row
        label={m.trendChange}
        current={change(current.changeKg)}
        previous={change(previous.changeKg)}
      />
      <Row
        label={m.ratePerWeek}
        current={change(current.ratePerWeekKg, m.perWeek)}
        previous={change(previous.ratePerWeekKg, m.perWeek)}
      />
    </>
  );
}

function MeasurementCell({
  latest,
  change,
  indicator,
  objective,
}: {
  latest: number | null;
  change: number | null;
  indicator: Indicator;
  objective: Objective | null;
}) {
  if (latest === null) return <Missing />;
  return (
    <span className="flex flex-wrap items-center gap-2">
      {formatCm(latest)}
      {change !== null && (
        <Change value={change} unit="cm" indicator={indicator} objective={objective} />
      )}
    </span>
  );
}

function MeasurementRows({
  items,
  days,
  today,
  objective,
}: {
  items: MeasurementSummary['items'];
  days: AnalyticsWindow;
  today: LocalDate;
  objective: Objective | null;
}) {
  return items.map((item) => {
    const points = item.series.map((p) => ({ date: p.date, value: p.valueCm }));
    const { current, previous } = measurementComparison(points, days, today);
    const cell = (w: typeof current) => (
      <MeasurementCell
        latest={w.latestCm}
        change={w.changeCm}
        indicator={item.bodyRegion}
        objective={objective}
      />
    );
    return (
      <Row key={item.id} label={item.name} current={cell(current)} previous={cell(previous)} />
    );
  });
}

/**
 * "Este período × anterior" (README §20.1): weight, measurements and
 * training of the last 7, 15, 30 or 60 days against the same number of days
 * before them. Plain numbers from the records, colored by the objective's
 * direction; the training card below follows the same period.
 */
export function PeriodComparison({
  weight,
  measurements,
  training,
  objective,
  today,
}: {
  weight: WeightSummary | null;
  measurements: MeasurementSummary['items'];
  training: TrainingData;
  objective: Objective | null;
  today: LocalDate;
}) {
  const [days, setDays] = useState<AnalyticsWindow>(DEFAULT_WINDOW);
  const trained = training.sessions.length > 0;
  if (!weight && measurements.length === 0 && !trained) return null;
  return (
    <>
      <Card aria-labelledby="period-comparison-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="period-comparison-title" className="text-heading font-semibold">
            {m.title}
          </h2>
          <SegmentedControl
            label={m.windowLabel}
            options={ANALYTICS_WINDOWS.map((d) => ({ value: String(d), label: m.window(d) }))}
            value={String(days)}
            onChange={(value) => setDays(Number(value) as AnalyticsWindow)}
          />
        </div>
        <Table>
          <thead>
            <tr>
              <TableHeader>{m.indicator}</TableHeader>
              <TableHeader>{m.current(days)}</TableHeader>
              <TableHeader>{m.previous(days)}</TableHeader>
            </tr>
          </thead>
          <tbody>
            {weight && (
              <WeightRows summary={weight} days={days} today={today} objective={objective} />
            )}
            <MeasurementRows items={measurements} days={days} today={today} objective={objective} />
            {trained && <TrainingRows data={training} days={days} today={today} />}
          </tbody>
        </Table>
        <p className="text-caption text-text-muted">{m.method}</p>
      </Card>
      {trained && <TrainingDetail data={training} days={days} today={today} />}
    </>
  );
}
