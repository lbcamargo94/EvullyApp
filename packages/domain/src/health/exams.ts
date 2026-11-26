import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import { analyteByCode } from './analytes';

/**
 * Laboratory exams typed by hand (README §24). The app stores what the report
 * says and never diagnoses: the only derived figure is where a value sits
 * against the laboratory's own range.
 */
export interface HealthResultDraft {
  analyteCode: string | null;
  analyteName: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  referenceText: string | null;
}

export interface HealthExamDraft {
  collectedOn: string;
  laboratory: string | null;
  notes: string | null;
  results: readonly HealthResultDraft[];
}

export interface NormalizedHealthExam extends Omit<HealthExamDraft, 'collectedOn' | 'results'> {
  collectedOn: LocalDate;
  results: HealthResultDraft[];
}

export type HealthResultFlag = 'below' | 'within' | 'above' | 'unknown';

export const HEALTH_RESULTS_MAX = 200;

const invalid = (code: string) => new ValidationError(code, code);
const text = (value: string | null) => value?.trim() || null;

/** The catalog entry of a coded marker; null for one typed by name. */
function analyteOf(code: string | null) {
  if (code === null) return null;
  const analyte = analyteByCode(code);
  if (!analyte) throw invalid('health.unknown_analyte');
  return analyte;
}

function checkRange(min: number | null, max: number | null) {
  if (min !== null && max !== null && min > max) throw invalid('health.reference_order');
}

function normalizeResult(draft: HealthResultDraft): HealthResultDraft {
  const analyte = analyteOf(draft.analyteCode);
  const name = draft.analyteName.trim() || analyte?.name || '';
  const unit = draft.unit.trim();
  if (!name) throw invalid('health.analyte_required');
  if (!unit) throw invalid('health.unit_required');
  if (!Number.isFinite(draft.value)) throw invalid('health.invalid_value');
  const { referenceMin: min, referenceMax: max } = draft;
  checkRange(min, max);
  return {
    analyteCode: analyte?.code ?? null,
    analyteName: name,
    value: draft.value,
    unit,
    referenceMin: min,
    referenceMax: max,
    referenceText: text(draft.referenceText),
  };
}

/** Validates an exam: collected on a past or current day, 1 to 200 results. */
export function normalizeHealthExam(
  draft: HealthExamDraft,
  today: LocalDate,
): NormalizedHealthExam {
  const collectedOn = parseLocalDate(draft.collectedOn);
  if (daysBetween(collectedOn, today) < 0) throw invalid('health.date_in_future');
  if (draft.results.length === 0) throw invalid('health.results_required');
  if (draft.results.length > HEALTH_RESULTS_MAX) throw invalid('health.too_many_results');
  return {
    collectedOn,
    laboratory: text(draft.laboratory),
    notes: text(draft.notes),
    results: draft.results.map(normalizeResult),
  };
}

/**
 * Where a value sits against the laboratory's range (README §24.3). A range
 * with only one bound still flags that side; without bounds it is `unknown`,
 * even when the report has a reference text: the app does not read it.
 */
export function resultFlag(
  result: Pick<HealthResultDraft, 'value' | 'referenceMin' | 'referenceMax'>,
): HealthResultFlag {
  const { value, referenceMin: min, referenceMax: max } = result;
  if (min === null && max === null) return 'unknown';
  if (min !== null && value < min) return 'below';
  if (max !== null && value > max) return 'above';
  return 'within';
}
