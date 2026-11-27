import type { AttachHealthDocumentInput, HealthDocumentDto } from '@evully/contracts';
import { checkHealthPdf, healthDocumentFileName, NotFoundError } from '@evully/domain';
import type { HealthDocumentRecord } from '../ports/health-repository';
import { toDocumentDto, type HealthDeps } from './manage-health';

/**
 * The laboratory PDF of an exam (README §24.2): chosen in the system dialog,
 * kept as it is and never read by the app.
 */
const notFound = () => new NotFoundError('health.document_not_found', 'Document not found');

async function contentOf(deps: HealthDeps, profileId: string, id: string) {
  const document = await deps.documents.content(profileId, id);
  if (!document) throw notFound();
  return document;
}

/** Attaches or replaces the exam's PDF; null when the dialog is cancelled. */
export class AttachHealthDocument {
  constructor(private readonly deps: HealthDeps) {}

  async execute({
    profileId,
    examId,
  }: AttachHealthDocumentInput): Promise<HealthDocumentDto | null> {
    const exam = await this.deps.exams.findById(profileId, examId);
    if (!exam) throw new NotFoundError('health.not_found', 'Exam not found');
    const chosen = await this.deps.files.choosePdf();
    if (!chosen) return null;
    checkHealthPdf(chosen.bytes);
    const record: HealthDocumentRecord = {
      id: this.deps.ids.next(),
      profileId,
      examId,
      fileName: healthDocumentFileName(chosen.fileName),
      sizeBytes: chosen.bytes.length,
      sha256: chosen.sha256,
      createdAt: this.deps.clock.nowIso(),
    };
    await this.deps.documents.replace(record, chosen.bytes);
    return toDocumentDto(record);
  }
}

/** Opens a temporary copy in the system PDF viewer. */
export class OpenHealthDocument {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    const { fileName, bytes } = await contentOf(this.deps, profileId, id);
    await this.deps.files.open(fileName, bytes);
    return null;
  }
}

/** Saves a copy where the person chooses; false when cancelled. */
export class SaveHealthDocumentCopy {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<boolean> {
    const { fileName, bytes } = await contentOf(this.deps, profileId, id);
    return this.deps.files.saveCopy(fileName, bytes);
  }
}

/** Takes the PDF off the exam (soft delete, after the window's confirmation). */
export class RemoveHealthDocument {
  constructor(private readonly deps: HealthDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.documents.softDelete(profileId, id, this.deps.clock.nowIso())))
      throw notFound();
    return null;
  }
}
