import {
  ANALYTES,
  analyteByCode,
  errorCode,
  localToday,
  parseDecimal,
  useRegisterHealthExam,
  useUpdateHealthExam,
} from '@evully/app-core';
import type { HealthExamDto, HealthExamInput, HealthResultValues } from '@evully/contracts';
import { Button, Card, Field, Icon, IconButton, Input, NativeSelect } from '@evully/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatValue, healthErrorByCode, healthMessages as m } from './messages.pt-BR';

const OTHER = '__other';

interface Row {
  key: number;
  code: string;
  name: string;
  value: string;
  unit: string;
  min: string;
  max: string;
  text: string;
}

let nextKey = 0;
const emptyRow = (): Row => ({
  key: nextKey++,
  code: '',
  name: '',
  value: '',
  unit: '',
  min: '',
  max: '',
  text: '',
});

const numberText = (n: number | null) => (n === null ? '' : formatValue(n).replace(/\./g, ''));

const rowOf = (r: HealthExamDto['results'][number]): Row => ({
  key: nextKey++,
  code: r.analyteCode ?? OTHER,
  name: r.analyteCode ? '' : r.analyteName,
  value: numberText(r.value),
  unit: r.unit,
  min: numberText(r.referenceMin),
  max: numberText(r.referenceMax),
  text: r.referenceText ?? '',
});

/** Empty optional number → null; text that is not a number → undefined (invalid). */
function optionalNumber(text: string): number | null | undefined {
  if (!text.trim()) return null;
  return parseDecimal(text) ?? undefined;
}

function toResult(row: Row): HealthResultValues | null {
  const value = parseDecimal(row.value);
  const min = optionalNumber(row.min);
  const max = optionalNumber(row.max);
  if (value === null || min === undefined || max === undefined) return null;
  const analyte = row.code && row.code !== OTHER ? analyteByCode(row.code) : null;
  return {
    analyteCode: analyte?.code ?? null,
    analyteName: analyte ? analyte.name : row.name,
    value,
    unit: row.unit,
    referenceMin: min,
    referenceMax: max,
    referenceText: row.text.trim() || null,
  };
}

function ResultRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: Row;
  index: number;
  onChange: (next: Row) => void;
  onRemove: (() => void) | null;
}) {
  const id = `health-result-${row.key}`;
  const set = (patch: Partial<Row>) => onChange({ ...row, ...patch });
  const pick = (code: string) => {
    const analyte = analyteByCode(code);
    set({ code, unit: analyte && !row.unit ? analyte.unit : row.unit });
  };
  return (
    <fieldset
      aria-label={m.resultLabel(index + 1)}
      className="flex flex-col gap-3 border-t border-border pt-3"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field id={`${id}-marker`} label={m.marker}>
            <NativeSelect
              id={`${id}-marker`}
              value={row.code}
              onChange={(e) => pick(e.target.value)}
            >
              <option value="">{m.markerPlaceholder}</option>
              {ANALYTES.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name}
                </option>
              ))}
              <option value={OTHER}>{m.otherMarker}</option>
            </NativeSelect>
          </Field>
        </div>
        {onRemove && (
          <IconButton label={m.removeResult(index + 1)} onClick={onRemove}>
            <Icon icon={Trash2} />
          </IconButton>
        )}
      </div>
      {row.code === OTHER && (
        <Field id={`${id}-name`} label={m.markerName}>
          <Input
            id={`${id}-name`}
            value={row.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={`${id}-value`} label={m.value}>
          <Input
            id={`${id}-value`}
            inputMode="decimal"
            value={row.value}
            onChange={(e) => set({ value: e.target.value })}
          />
        </Field>
        <Field id={`${id}-unit`} label={m.unit}>
          <Input
            id={`${id}-unit`}
            value={row.unit}
            onChange={(e) => set({ unit: e.target.value })}
          />
        </Field>
        <Field id={`${id}-min`} label={m.referenceMin}>
          <Input
            id={`${id}-min`}
            inputMode="decimal"
            value={row.min}
            onChange={(e) => set({ min: e.target.value })}
          />
        </Field>
        <Field id={`${id}-max`} label={m.referenceMax}>
          <Input
            id={`${id}-max`}
            inputMode="decimal"
            value={row.max}
            onChange={(e) => set({ max: e.target.value })}
          />
        </Field>
      </div>
      <Field id={`${id}-text`} label={m.referenceText}>
        <Input id={`${id}-text`} value={row.text} onChange={(e) => set({ text: e.target.value })} />
      </Field>
    </fieldset>
  );
}

function initialValues(editing: HealthExamDto | null) {
  return {
    collectedOn: editing?.collectedOn ?? localToday(),
    laboratory: editing?.laboratory ?? '',
    notes: editing?.notes ?? '',
    rows: editing ? editing.results.map(rowOf) : [emptyRow()],
  };
}

/** Registers a new exam or saves the one being edited. */
function useSaveExam(profileId: string, editing: HealthExamDto | null) {
  const register = useRegisterHealthExam(profileId);
  const update = useUpdateHealthExam(profileId);
  const save = (input: Omit<HealthExamInput, 'profileId'>) =>
    editing ? update.mutateAsync({ id: editing.id, ...input }) : register.mutateAsync(input);
  return { save, busy: register.isPending || update.isPending };
}

/** New exam or the one being edited (README §24.1): typed from the report. */
export function HealthExamForm({
  profileId,
  editing,
  onDone,
}: {
  profileId: string;
  editing: HealthExamDto | null;
  onDone: () => void;
}) {
  const { save, busy } = useSaveExam(profileId, editing);
  const start = initialValues(editing);
  const [collectedOn, setCollectedOn] = useState(start.collectedOn);
  const [laboratory, setLaboratory] = useState(start.laboratory);
  const [notes, setNotes] = useState(start.notes);
  const [rows, setRows] = useState<Row[]>(start.rows);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const results = rows.map(toResult);
    if (results.some((r) => r === null)) return setError(m.invalidNumber);
    try {
      await save({
        collectedOn,
        laboratory: laboratory.trim() || null,
        notes: notes.trim() || null,
        results: results as HealthResultValues[],
      });
      setError(null);
      setSaved(true);
      // A new exam clears the form for the next one; the date stays.
      setLaboratory('');
      setNotes('');
      setRows([emptyRow()]);
      onDone();
    } catch (err) {
      setError(healthErrorByCode[errorCode(err) ?? ''] ?? m.genericError);
    }
  };

  return (
    <Card aria-labelledby="health-form-title" className="w-full max-w-2xl">
      <h2 id="health-form-title" className="text-heading font-semibold">
        {editing ? m.editExam : m.newExam}
      </h2>
      <form
        noValidate
        aria-labelledby="health-form-title"
        onSubmit={(e) => void submit(e)}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="health-collected" label={m.collectedOn}>
            <Input
              id="health-collected"
              type="date"
              max={localToday()}
              value={collectedOn}
              onChange={(e) => setCollectedOn(e.target.value)}
            />
          </Field>
          <Field id="health-lab" label={m.laboratory}>
            <Input
              id="health-lab"
              value={laboratory}
              onChange={(e) => setLaboratory(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-body font-semibold">{m.results}</h3>
          <p className="text-caption text-text-muted">{m.referenceHint}</p>
        </div>
        {rows.map((row, i) => (
          <ResultRow
            key={row.key}
            row={row}
            index={i}
            onChange={(next) => setRows((rs) => rs.map((r) => (r.key === row.key ? next : r)))}
            onRemove={
              rows.length > 1 ? () => setRows((rs) => rs.filter((r) => r.key !== row.key)) : null
            }
          />
        ))}
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
          >
            <Icon icon={Plus} />
            {m.addResult}
          </Button>
        </div>
        <Field id="health-notes" label={m.notes}>
          <Input id="health-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="text-caption text-text-muted">
            {m.saved}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" busy={busy}>
            {busy ? m.saving : m.save}
          </Button>
          {editing && (
            <Button type="button" variant="ghost" onClick={onDone}>
              {m.cancelEdit}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
