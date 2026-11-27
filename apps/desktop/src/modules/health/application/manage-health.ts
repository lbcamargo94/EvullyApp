import type {
  HealthDocumentDto,
  HealthExamDto,
  HealthExamInput,
  HealthSettings,
  SetHealthSettingsInput,
  UpdateHealthExamInput,
} from '@evully/contracts';
import { normalizeHealthExam, NotFoundError, resultFlag } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { SettingsRepository } from '../../settings/ports/settings-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type {
  HealthDocumentFiles,
  HealthDocumentRecord,
  HealthDocumentRepository,
  HealthExamRecord,
  HealthExamRepository,
} from '../ports/health-repository';

export interface HealthDeps {
  profiles: ProfileRepository;
  exams: HealthExamRepository;
  documents: HealthDocumentRepository;
  files: HealthDocumentFiles;
  settings: SettingsRepository;
  clock: Clock;
  ids: IdGenerator;
}

/** Per-profile settings (README §24): the area starts hidden. */
export const HEALTH_ENABLED_KEY = 'health_enabled';
export const HEALTH_NOTICE_KEY = 'health_notice_accepted_at';

export const toDocumentDto = (d: HealthDocumentRecord): HealthDocumentDto => ({
  id: d.id,
  examId: d.examId,
  fileName: d.fileName,
  sizeBytes: d.sizeBytes,
  createdAt: d.createdAt,
});

const toDto = (
  e: HealthExamRecord,
  document: HealthDocumentRecord | null = null,
): HealthExamDto => ({
  id: e.id,
  collectedOn: e.collectedOn,
  laboratory: e.laboratory,
  notes: e.notes,
  results: e.results.map((r) => ({ ...r, flag: resultFlag(r) })),
  document: document ? toDocumentDto(document) : null,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

const notFound = () => new NotFoundError('health.not_found', 'Exam not found');

async function settingsOf(deps: HealthDeps, profileId: string): Promise<HealthSettings> {
  const [enabled, accepted] = await Promise.all([
    deps.settings.get(profileId, HEALTH_ENABLED_KEY),
    deps.settings.get(profileId, HEALTH_NOTICE_KEY),
  ]);
  return {
    enabled: enabled === true,
    noticeAcceptedAt: typeof accepted === 'string' ? accepted : null,
  };
}

export class GetHealthSettings {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<HealthSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return settingsOf(this.deps, profileId);
  }
}

/**
 * Turns the area on or off. Turning it on records when the notice was
 * accepted (the window shows it first); turning it off only hides the area:
 * the exams stay.
 */
export class SetHealthSettings {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, enabled }: SetHealthSettingsInput): Promise<HealthSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    await this.deps.settings.set(profileId, HEALTH_ENABLED_KEY, enabled);
    const current = await settingsOf(this.deps, profileId);
    if (enabled && current.noticeAcceptedAt === null) {
      await this.deps.settings.set(profileId, HEALTH_NOTICE_KEY, this.deps.clock.nowIso());
    }
    return settingsOf(this.deps, profileId);
  }
}

/** Active exams, newest first (README §24). */
export class ListHealthExams {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<HealthExamDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const [exams, documents] = await Promise.all([
      this.deps.exams.list(profileId),
      this.deps.documents.list(profileId),
    ]);
    const byExam = new Map(documents.map((d) => [d.examId, d]));
    return exams.map((e) => toDto(e, byExam.get(e.id)));
  }
}

function build(
  deps: HealthDeps,
  input: Omit<HealthExamInput, 'profileId'>,
): Pick<HealthExamRecord, 'collectedOn' | 'laboratory' | 'notes' | 'results'> {
  const exam = normalizeHealthExam(input, deps.clock.today());
  return { ...exam, results: exam.results.map((r) => ({ ...r, id: deps.ids.next() })) };
}

export class RegisterHealthExam {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, ...input }: HealthExamInput): Promise<HealthExamDto> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const now = this.deps.clock.nowIso();
    const record: HealthExamRecord = {
      ...build(this.deps, input),
      id: this.deps.ids.next(),
      profileId,
      createdAt: now,
      updatedAt: now,
    };
    await this.deps.exams.insert(record);
    return toDto(record);
  }
}

export class UpdateHealthExam {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, id, ...input }: UpdateHealthExamInput): Promise<HealthExamDto> {
    const current = await this.deps.exams.findById(profileId, id);
    if (!current) throw notFound();
    const record: HealthExamRecord = {
      ...current,
      ...build(this.deps, input),
      updatedAt: this.deps.clock.nowIso(),
    };
    await this.deps.exams.update(record);
    const documents = await this.deps.documents.list(profileId);
    return toDto(
      record,
      documents.find((d) => d.examId === id),
    );
  }
}

export class DeleteHealthExam {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.exams.softDelete(profileId, id, this.deps.clock.nowIso())))
      throw notFound();
    return null;
  }
}
