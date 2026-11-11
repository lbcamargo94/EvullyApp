import type { ExportResult, TransferImportResult, TransferPreview } from '@evully/contracts';
import {
  DomainError,
  NotFoundError,
  TRANSFER_FORMAT,
  TRANSFER_FORMAT_VERSION,
  ValidationError,
  assertTransferable,
  transferFileName,
} from '@evully/domain';
import { CreateBackup, type BackupDeps } from '../../backup/application/create-backup';
import { ExportProfile, type ExportDeps } from '../../exports/application/export-profile';
import type { IdGenerator } from '../../shared/ports';
import type { TransferFiles, TransferPlan, TransferRepository } from '../ports/transfer-ports';
import {
  buildTransferPlan,
  transferCounts,
  transferDocumentSchema,
  transferManifestSchema,
  type TransferDocument,
} from './transfer-plan';

export interface TransferDeps {
  export: ExportDeps;
  repository: TransferRepository;
  files: TransferFiles;
  backup: BackupDeps;
  ids: IdGenerator;
  defaultBackupDirectory: string;
}

const invalid = () => new ValidationError('transfer.invalid', 'Not an Evully profile transfer');

/** "Exportar perfil" (README §14.4): the JSON export plus a manifest, in one zip. */
export class ExportTransfer {
  constructor(private readonly deps: TransferDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<ExportResult> {
    const { clock, appVersion, schemaVersion } = this.deps.export;
    const doc = await new ExportProfile(this.deps.export).document(profileId);
    const saved = await this.deps.files.save(
      transferFileName(doc.profile.name, clock.today()),
      JSON.stringify(doc),
      {
        format: TRANSFER_FORMAT,
        formatVersion: TRANSFER_FORMAT_VERSION,
        appVersion,
        schemaVersion,
        createdAt: clock.nowIso(),
        profileId: doc.profile.id,
        profileName: doc.profile.name,
      },
    );
    return saved === null ? null : { fileName: saved };
  }
}

/** The one validated file waiting for confirmation; nothing is written before it. */
export class PendingTransfer {
  private item: { token: string; plan: TransferPlan } | null = null;

  put(token: string, plan: TransferPlan) {
    this.item = { token, plan };
  }

  take(token: string): TransferPlan {
    if (!this.item || this.item.token !== token) {
      throw new NotFoundError('transfer.expired', 'Transfer preview not found');
    }
    const { plan } = this.item;
    this.item = null;
    return plan;
  }

  discard(token: string) {
    if (this.item?.token === token) this.item = null;
  }
}

function parseDocument(json: string): TransferDocument {
  try {
    const parsed = transferDocumentSchema.safeParse(JSON.parse(json));
    if (parsed.success) return parsed.data;
  } catch {
    // Not JSON: refused below.
  }
  throw invalid();
}

/** "Importar perfil": picks a file, validates it and shows what it holds. */
export class PrepareProfileImport {
  constructor(
    private readonly deps: TransferDeps,
    private readonly pending: PendingTransfer,
  ) {}

  async execute(): Promise<TransferPreview | null> {
    const opened = await this.deps.files.open();
    if (!opened) return null;
    const manifest = transferManifestSchema.safeParse(opened.manifest);
    if (!manifest.success) throw invalid();
    assertTransferable({
      format: manifest.data.format,
      formatVersion: manifest.data.formatVersion,
      manifestSha256: manifest.data.sha256,
      actualSha256: opened.sha256,
      schemaVersion: manifest.data.schemaVersion,
      appSchemaVersion: this.deps.export.schemaVersion,
    });
    const doc = parseDocument(opened.profileJson);
    if (doc.profile.id !== manifest.data.profileId) throw invalid();
    const { repository } = this.deps;
    const plan = await buildTransferPlan(doc, (table) => repository.columns(table));
    const token = this.deps.ids.next();
    this.pending.put(token, plan);
    return {
      token,
      fileName: opened.fileName,
      profileName: doc.profile.name,
      exportedAt: doc.exportedAt,
      appVersion: doc.appVersion,
      counts: transferCounts(doc),
      existing: await repository.existing(doc.profile.id),
    };
  }
}

/** Creates the profile, or replaces the one with the same id after a backup. */
export class ConfirmProfileImport {
  constructor(
    private readonly deps: TransferDeps,
    private readonly pending: PendingTransfer,
  ) {}

  async execute({ token }: { token: string }): Promise<TransferImportResult> {
    const plan = this.pending.take(token);
    const replace = (await this.deps.repository.existing(plan.profileId)) !== null;
    if (replace) {
      await new CreateBackup(this.deps.backup).execute({
        kind: 'pre-import',
        directory: this.deps.defaultBackupDirectory,
      });
    }
    try {
      await this.deps.repository.write(plan, replace);
    } catch (e) {
      // The transaction was rolled back: this computer keeps its data.
      if (e instanceof DomainError) throw e;
      throw new ValidationError('transfer.failed', 'The profile could not be imported');
    }
    return { profileId: plan.profileId, replaced: replace };
  }
}
