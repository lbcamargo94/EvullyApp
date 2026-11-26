import { ANALYTES } from './analytes';
import { resultFlag, type HealthResultFlag } from './exams';

/**
 * Analyses over the exams already typed (README §24.3). Everything is a plain
 * comparison of what the reports say: no estimate, no diagnosis, and the
 * laboratory's own range is the only reference.
 */
export interface MarkerResultInput {
  analyteCode: string | null;
  analyteName: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
}

export interface MarkerExamInput {
  id: string;
  collectedOn: string;
  results: readonly MarkerResultInput[];
}

export interface MarkerPoint {
  examId: string;
  collectedOn: string;
  value: number;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  flag: HealthResultFlag;
}

export interface MarkerHistory {
  key: string;
  analyteCode: string | null;
  name: string;
  /** Oldest first. */
  points: MarkerPoint[];
}

/** `unit_changed` when the last two results use different units. */
export type MarkerTrend = 'up' | 'down' | 'same' | 'unit_changed' | 'single';

/** README §24.4: never alarming, and never a verdict. */
export type MarkerLevel = 'informative' | 'attention' | 'professional';

const folded = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');

const CODE_BY_NAME = new Map(ANALYTES.map((a) => [folded(a.name), a.code]));

/**
 * One series per marker: the catalog code, or the typed name ignoring case and
 * accents. A typed name equal to a catalog name joins that marker.
 */
export function markerKey(result: Pick<MarkerResultInput, 'analyteCode' | 'analyteName'>): string {
  const name = folded(result.analyteName);
  return result.analyteCode ?? CODE_BY_NAME.get(name) ?? `name:${name}`;
}

const pointOf = (examId: string, collectedOn: string, r: MarkerResultInput): MarkerPoint => ({
  examId,
  collectedOn,
  value: r.value,
  unit: r.unit,
  referenceMin: r.referenceMin,
  referenceMax: r.referenceMax,
  flag: resultFlag(r),
});

/** `YYYY-MM-DD` sorts as text; ids (UUID v7) break ties by creation. */
const byDate = (a: MarkerExamInput, b: MarkerExamInput) =>
  a.collectedOn.localeCompare(b.collectedOn) || a.id.localeCompare(b.id);

/** Every marker across the exams, by name; the first result wins within one exam. */
export function markerHistories(exams: readonly MarkerExamInput[]): MarkerHistory[] {
  const series = new Map<string, MarkerHistory>();
  for (const exam of [...exams].sort(byDate)) {
    const seen = new Set<string>();
    for (const r of exam.results) {
      const key = markerKey(r);
      if (seen.has(key)) continue;
      seen.add(key);
      const history = series.get(key) ?? {
        key,
        analyteCode: key.startsWith('name:') ? null : key,
        name: r.analyteName,
        points: [],
      };
      history.name = r.analyteName;
      history.points.push(pointOf(exam.id, exam.collectedOn, r));
      series.set(key, history);
    }
  }
  return [...series.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** The last value against the one before, only when both use the same unit. */
export function markerTrend(points: readonly MarkerPoint[]): MarkerTrend {
  const last = points.at(-1);
  const previous = points.at(-2);
  if (!last || !previous) return 'single';
  if (folded(last.unit) !== folded(previous.unit)) return 'unit_changed';
  if (last.value > previous.value) return 'up';
  if (last.value < previous.value) return 'down';
  return 'same';
}

const isOut = (flag: HealthResultFlag | undefined) => flag === 'below' || flag === 'above';

/**
 * Informative when the last result is within the laboratory range (or there is
 * none); Attention when it is outside; Professional evaluation recommended when
 * the last two exams are outside on the same side.
 */
export function markerLevel(points: readonly MarkerPoint[]): MarkerLevel {
  const last = points.at(-1)?.flag;
  if (!isOut(last)) return 'informative';
  return points.at(-2)?.flag === last ? 'professional' : 'attention';
}

export interface ExamComparisonRow {
  key: string;
  name: string;
  before: MarkerPoint | null;
  after: MarkerPoint | null;
  /** `after - before`, only when both exist in the same unit. */
  difference: number | null;
}

const pointsByKey = (exam: MarkerExamInput) => {
  const map = new Map<string, { name: string; point: MarkerPoint }>();
  for (const r of exam.results) {
    const key = markerKey(r);
    if (!map.has(key))
      map.set(key, { name: r.analyteName, point: pointOf(exam.id, exam.collectedOn, r) });
  }
  return map;
};

const differenceOf = (before: MarkerPoint | null, after: MarkerPoint | null) =>
  before && after && folded(before.unit) === folded(after.unit)
    ? Math.round((after.value - before.value) * 1e6) / 1e6
    : null;

/** Two exams side by side, the older one first, markers by name. */
export function compareExams(a: MarkerExamInput, b: MarkerExamInput): ExamComparisonRow[] {
  const [older, newer] = byDate(a, b) <= 0 ? [a, b] : [b, a];
  const before = pointsByKey(older);
  const after = pointsByKey(newer);
  const keys = new Set([...before.keys(), ...after.keys()]);
  return [...keys]
    .map((key): ExamComparisonRow => {
      const b0 = before.get(key) ?? null;
      const a0 = after.get(key) ?? null;
      const name = (a0 ?? b0)?.name ?? '';
      const [p0, p1] = [b0?.point ?? null, a0?.point ?? null];
      return { key, name, before: p0, after: p1, difference: differenceOf(p0, p1) };
    })
    .sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
}
