import {
  addDays,
  errorCode,
  parseLocalDate,
  useCardioOverview,
  useCurrentProfile,
  useDeleteCardio,
} from '@evully/app-core';
import type { CardioOverview, CardioSessionDto } from '@evully/contracts';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  ScreenHeader,
  ShowMoreButton,
  useShowMore,
} from '@evully/ui';
import { sharedMessages } from '../shared/messages.pt-BR';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CardioForm } from './cardio-form';
import { CardioTargetForm, CardioTargetProgress } from './cardio-target';
import {
  activityLabels,
  cardioErrorByCode,
  cardioMessages as m,
  formatDayMonth,
  formatKm,
  formatWeekday,
  intensityLabels,
} from './messages.pt-BR';

type Week = CardioOverview['thisWeek'];

const labelOf = (s: Pick<CardioSessionDto, 'activityType' | 'activityName'>) =>
  s.activityType === 'custom'
    ? (s.activityName ?? activityLabels.custom)
    : activityLabels[s.activityType];

const weekLine = (w: Week) =>
  [m.sessions(w.sessions), m.minutes(w.minutes), w.distanceKm > 0 ? formatKm(w.distanceKm) : null]
    .filter(Boolean)
    .join(' · ');

/** Cardio (README §11.1, §16.2): quick entry, this week and history by week. */
export function CardioScreen() {
  const { profileId } = useCurrentProfile();
  const { data: overview } = useCardioOverview(profileId);
  const [editing, setEditing] = useState<CardioSessionDto | null>(null);
  if (!profileId || !overview) return null;

  return (
    <>
      <ScreenHeader title={m.title} />
      <div className="flex flex-wrap items-start gap-6">
        <CardioForm
          key={editing?.id ?? 'new'}
          profileId={profileId}
          editing={editing}
          onDone={() => setEditing(null)}
        />
        <ThisWeek profileId={profileId} overview={overview} />
      </div>
      <section aria-label={m.history} className="flex flex-col gap-4">
        <h2 className="text-heading font-semibold">{m.history}</h2>
        {overview.weeks.length === 0 && <EmptyState>{m.empty}</EmptyState>}
        <WeekList profileId={profileId} weeks={overview.weeks} onEdit={setEditing} />
      </section>
    </>
  );
}

/** Weeks shown at first and added per "Mostrar mais". */
const STEP = 8;

function WeekList({
  profileId,
  weeks,
  onEdit,
}: {
  profileId: string;
  weeks: CardioOverview['weeks'];
  onEdit: (session: CardioSessionDto) => void;
}) {
  const { visible, hidden, showMore } = useShowMore(weeks, STEP);
  return (
    <>
      {visible.map((w) => (
        <WeekCard key={w.summary.weekStart} profileId={profileId} week={w} onEdit={onEdit} />
      ))}
      <ShowMoreButton hidden={hidden} onClick={showMore}>
        {sharedMessages.showMore(Math.min(hidden, STEP))}
      </ShowMoreButton>
    </>
  );
}

function ThisWeek({ profileId, overview }: { profileId: string; overview: CardioOverview }) {
  const { thisWeek: week, target } = overview;
  const [editingTarget, setEditingTarget] = useState(false);
  return (
    <Card aria-labelledby="cardio-week-title" className="flex-[1_1_280px] gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="cardio-week-title" className="text-heading font-semibold">
          {m.thisWeek}
        </h2>
        {!editingTarget && (
          <Button
            type="button"
            variant="ghost"
            className="min-h-9 px-2"
            onClick={() => setEditingTarget(true)}
          >
            {target ? m.targetEdit : m.targetSet}
          </Button>
        )}
      </div>
      <span className="text-display font-semibold tabular-nums">{m.minutes(week.minutes)}</span>
      <span className="text-caption text-text-muted">{weekLine(week)}</span>
      {editingTarget ? (
        <CardioTargetForm
          profileId={profileId}
          target={target}
          onDone={() => setEditingTarget(false)}
        />
      ) : (
        target && <CardioTargetProgress week={week} target={target} />
      )}
      {week.byActivity.length > 0 && (
        <ul className="flex flex-col gap-1 text-body">
          {week.byActivity.map((a) => (
            <li
              key={`${a.activityType}:${a.activityName ?? ''}`}
              className="flex justify-between gap-3 tabular-nums"
            >
              <span>{labelOf(a)}</span>
              <span className="text-text-muted">{weekLine({ ...week, ...a, byActivity: [] })}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function WeekCard({
  profileId,
  week,
  onEdit,
}: {
  profileId: string;
  week: CardioOverview['weeks'][number];
  onEdit: (s: CardioSessionDto) => void;
}) {
  const remove = useDeleteCardio(profileId);
  const [pending, setPending] = useState<CardioSessionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = week.summary.weekStart;
  const title = m.weekOf(formatDayMonth(start), formatDayMonth(addDays(parseLocalDate(start), 6)));

  const confirm = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(cardioErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <Card aria-label={title} className="gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-heading font-semibold">{title}</h3>
        <span className="text-caption text-text-muted tabular-nums">{weekLine(week.summary)}</span>
      </div>
      <ul className="flex flex-col">
        {week.sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 border-t border-border py-2">
            <span className="w-24 text-caption text-text-muted">
              {formatWeekday(s.sessionDate)}
            </span>
            <span className="flex-1">
              <span className="font-medium">{labelOf(s)}</span>
              <span className="text-caption text-text-muted tabular-nums">
                {' · '}
                {[
                  m.minutes(s.durationMinutes),
                  s.distanceKm !== null ? formatKm(s.distanceKm) : null,
                  s.intensity ? intensityLabels[s.intensity] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
            <IconButton label={m.edit(labelOf(s))} onClick={() => onEdit(s)}>
              <Icon icon={Pencil} />
            </IconButton>
            <IconButton label={m.remove(labelOf(s))} onClick={() => setPending(s)}>
              <Icon icon={Trash2} />
            </IconButton>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-body text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.removeTitle}
        description={m.removeBody}
        confirmLabel={m.removeConfirm}
        cancelLabel={m.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirm()}
      />
    </Card>
  );
}
