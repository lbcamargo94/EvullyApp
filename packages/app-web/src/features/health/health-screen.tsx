import {
  errorCode,
  useCurrentProfile,
  useDeleteHealthExam,
  useHealthExams,
  useHealthSettings,
} from '@evully/app-core';
import type { HealthExamDto, HealthResultDto } from '@evully/contracts';
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Icon,
  IconButton,
  ScreenHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router';
import { ExamComparison } from './exam-comparison';
import { HealthExamForm } from './health-exam-form';
import { HealthMarkers } from './health-markers';
import {
  flagLabels,
  formatExamDate,
  formatReference,
  formatValue,
  healthErrorByCode,
  healthMessages as m,
  healthTabs,
  type HealthTab,
} from './messages.pt-BR';

const outOfRange = (r: HealthResultDto) => r.flag === 'below' || r.flag === 'above';

/** Saúde (README §24): exams typed by hand, flagged only against the laboratory range. */
export function HealthScreen() {
  const { profileId } = useCurrentProfile();
  const settings = useHealthSettings(profileId).data;
  const { data: exams } = useHealthExams(profileId);
  const [editing, setEditing] = useState<HealthExamDto | null>(null);
  const [tab, setTab] = useState<HealthTab>('exams');
  if (!profileId || !settings || !exams) return null;
  if (!settings.enabled) return <Navigate to="/app/settings?tab=health" replace />;

  return (
    <>
      <ScreenHeader title={m.title} description={m.subtitle} />
      <p role="note" className="max-w-2xl text-caption text-text-muted">
        {m.notice}
      </p>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as HealthTab)}
        className="flex flex-col gap-4"
      >
        <TabsList aria-label={m.title}>
          {(Object.keys(healthTabs) as HealthTab[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {healthTabs[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="exams" className="flex flex-col gap-4">
          <HealthExamForm
            key={editing?.id ?? 'new'}
            profileId={profileId}
            editing={editing}
            onDone={() => setEditing(null)}
          />
          <ExamList profileId={profileId} exams={exams} onEdit={setEditing} />
        </TabsContent>
        <TabsContent value="markers">
          <HealthMarkers exams={exams} />
        </TabsContent>
        <TabsContent value="compare">
          <ExamComparison exams={exams} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ResultLine({ r }: { r: HealthResultDto }) {
  const reference = formatReference(r);
  const flag = flagLabels[r.flag];
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border py-2">
      <span className="min-w-40 flex-1 font-semibold">{r.analyteName}</span>
      <span className="tabular-nums">
        {formatValue(r.value)} {r.unit}
      </span>
      <span className="text-caption text-text-muted tabular-nums">
        {m.reference}: {reference ?? m.noReference}
      </span>
      {flag && (
        <Badge size="sm" tone={outOfRange(r) ? 'caution' : 'neutral'}>
          {flag}
        </Badge>
      )}
    </li>
  );
}

function ExamList({
  profileId,
  exams,
  onEdit,
}: {
  profileId: string;
  exams: HealthExamDto[];
  onEdit: (exam: HealthExamDto) => void;
}) {
  const remove = useDeleteHealthExam(profileId);
  const [pending, setPending] = useState<HealthExamDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(healthErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
    setPending(null);
  };

  return (
    <Card aria-labelledby="health-history-title" className="gap-3">
      <h2 id="health-history-title" className="text-heading font-semibold">
        {m.history}
      </h2>
      {exams.length === 0 && <EmptyState title={m.emptyTitle}>{m.empty}</EmptyState>}
      {exams.map((exam) => {
        const date = formatExamDate(exam.collectedOn);
        const attention = exam.results.filter(outOfRange).length;
        return (
          <section
            key={exam.id}
            aria-label={date}
            className="flex flex-col gap-1 rounded-md border border-border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex-1 text-body font-semibold">
                {date}
                {exam.laboratory && (
                  <span className="font-normal text-text-muted"> · {exam.laboratory}</span>
                )}
              </h3>
              {attention > 0 && (
                <Badge size="sm" tone="caution">
                  {m.attentionCount(attention)}
                </Badge>
              )}
              <IconButton label={m.edit(date)} onClick={() => onEdit(exam)}>
                <Icon icon={Pencil} />
              </IconButton>
              <IconButton label={m.remove(date)} onClick={() => setPending(exam)}>
                <Icon icon={Trash2} />
              </IconButton>
            </div>
            <ul className="flex flex-col">
              {exam.results.map((r) => (
                <ResultLine key={r.id} r={r} />
              ))}
            </ul>
            {exam.notes && <p className="text-caption text-text-muted">{exam.notes}</p>}
          </section>
        );
      })}
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
