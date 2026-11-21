import {
  formatLocalDate,
  trainingComparison,
  type AnalyticsWindow,
  type LocalDate,
  type MuscleGroupWindow,
  type PersonalRecord,
  type PlanSchedule,
  type TrainingSession,
} from '@evully/app-core';
import {
  Badge,
  Card,
  ShowMoreButton,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  useShowMore,
} from '@evully/ui';
import { sharedMessages } from '../shared/messages.pt-BR';
import { muscleGroupLabels } from '../workouts/messages.pt-BR';
import { Missing, Row } from './comparison-table';
import { comparisonMessages as m, formatWhole } from './messages.pt-BR';

/** Finished workouts and the active plans' schedules, as the domain reads them. */
export interface TrainingData {
  sessions: TrainingSession[];
  plans: PlanSchedule[];
}

const kg = (value: number) => `${formatWhole(value)} kg`;

/** Workouts, plan adherence, sets and volume in the comparison table. */
export function TrainingRows({
  data,
  days,
  today,
}: {
  data: TrainingData;
  days: AnalyticsWindow;
  today: LocalDate;
}) {
  const { current, previous } = trainingComparison(data.sessions, data.plans, days, today);
  const adherence = (w: typeof current) =>
    w.adherence ? m.adherence(w.adherence.done, w.adherence.planned) : <Missing />;
  return (
    <>
      <Row
        label={m.workouts}
        current={formatWhole(current.workouts)}
        previous={formatWhole(previous.workouts)}
      />
      <Row label={m.adherenceLabel} current={adherence(current)} previous={adherence(previous)} />
      <Row
        label={m.sets}
        current={formatWhole(current.sets)}
        previous={formatWhole(previous.sets)}
      />
      <Row label={m.volume} current={kg(current.volumeKg)} previous={kg(previous.volumeKg)} />
    </>
  );
}

function RecordItem({ record }: { record: PersonalRecord }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <span className="w-12 text-caption text-text-muted tabular-nums">
        {formatLocalDate(record.date).slice(0, 5)}
      </span>
      <span className="font-semibold">{record.name}</span>
      <span className="tabular-nums">{m.recordValue(record.weightKg, record.repetitions)}</span>
      <Badge tone="positive">{m.recordKind[record.kind]}</Badge>
      <span className="text-caption text-text-muted">
        {record.kind === 'load'
          ? m.recordBeforeLoad(record.previous)
          : m.recordBeforeReps(record.previous)}
      </span>
    </li>
  );
}

const RECORDS_STEP = 8;

/** Newest records first; long periods show "Mostrar mais". */
function RecordList({ records }: { records: PersonalRecord[] }) {
  const { visible, hidden, showMore } = useShowMore([...records].reverse(), RECORDS_STEP);
  return (
    <>
      <ul className="divide-y divide-border/60">
        {visible.map((r) => (
          <RecordItem key={`${r.date}-${r.exerciseId}`} record={r} />
        ))}
      </ul>
      <ShowMoreButton hidden={hidden} onClick={showMore}>
        {sharedMessages.showMore(Math.min(hidden, RECORDS_STEP))}
      </ShowMoreButton>
    </>
  );
}

function GroupTable({
  current,
  previous,
}: {
  current: MuscleGroupWindow[];
  previous: MuscleGroupWindow[];
}) {
  const before = new Map(previous.map((g) => [g.muscleGroup, g]));
  return (
    <Table>
      <thead>
        <tr>
          <TableHeader>{m.group}</TableHeader>
          <TableHeader>{m.sets}</TableHeader>
          <TableHeader>{m.volume}</TableHeader>
          <TableHeader>{m.workouts}</TableHeader>
          <TableHeader>{m.setsBefore}</TableHeader>
        </tr>
      </thead>
      <tbody>
        {current.map((g) => (
          <TableRow key={g.muscleGroup}>
            <th scope="row" className="px-3 py-3 font-normal">
              {muscleGroupLabels[g.muscleGroup]}
            </th>
            <TableCell>{formatWhole(g.sets)}</TableCell>
            <TableCell>{kg(g.volumeKg)}</TableCell>
            <TableCell>{formatWhole(g.workouts)}</TableCell>
            <TableCell className="text-text-muted">
              {formatWhole(before.get(g.muscleGroup)?.sets ?? 0)}
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

/**
 * Records and muscle groups of the chosen period (README §20.1): measured
 * sets only, primary muscle group only.
 */
export function TrainingDetail({
  data,
  days,
  today,
}: {
  data: TrainingData;
  days: AnalyticsWindow;
  today: LocalDate;
}) {
  const { current, previous } = trainingComparison(data.sessions, data.plans, days, today);
  return (
    <Card aria-labelledby="training-period-title">
      <h2 id="training-period-title" className="text-heading font-semibold">
        {m.trainingTitle(days)}
      </h2>
      <section aria-labelledby="training-records-title" className="flex flex-col gap-1">
        <h3 id="training-records-title" className="text-body font-semibold">
          {m.recordsTitle}
        </h3>
        {current.records.length === 0 ? (
          <p className="text-body text-text-muted">{m.recordsEmpty}</p>
        ) : (
          <RecordList records={current.records} />
        )}
      </section>
      <section aria-labelledby="training-groups-title" className="flex flex-col gap-1">
        <h3 id="training-groups-title" className="text-body font-semibold">
          {m.groupsTitle}
        </h3>
        {current.groups.length === 0 ? (
          <p className="text-body text-text-muted">{m.groupsEmpty}</p>
        ) : (
          <GroupTable current={current.groups} previous={previous.groups} />
        )}
      </section>
      <p className="text-caption text-text-muted">{m.trainingMethod}</p>
    </Card>
  );
}
