import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type { HealthDocumentRecord, HealthDocumentRepository } from '../ports/health-repository';

export class KyselyHealthDocumentRepository implements HealthDocumentRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async list(profileId: string): Promise<HealthDocumentRecord[]> {
    const rows = await this.db
      .selectFrom('health_documents')
      .select(['id', 'profile_id', 'exam_id', 'file_name', 'size_bytes', 'sha256', 'created_at'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .execute();
    return rows.map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      examId: r.exam_id,
      fileName: r.file_name,
      sizeBytes: r.size_bytes,
      sha256: r.sha256,
      createdAt: r.created_at,
    }));
  }

  async content(profileId: string, id: string) {
    const row = await this.db
      .selectFrom('health_documents')
      .select(['file_name', 'content'])
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row ? { fileName: row.file_name, bytes: new Uint8Array(row.content) } : null;
  }

  async replace(document: HealthDocumentRecord, bytes: Uint8Array): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('health_documents')
        .set({ deleted_at: document.createdAt })
        .where('profile_id', '=', document.profileId)
        .where('exam_id', '=', document.examId)
        .where('deleted_at', 'is', null)
        .execute();
      await trx
        .insertInto('health_documents')
        .values({
          id: document.id,
          profile_id: document.profileId,
          exam_id: document.examId,
          file_name: document.fileName,
          size_bytes: document.sizeBytes,
          sha256: document.sha256,
          content: bytes,
          created_at: document.createdAt,
          deleted_at: null,
        })
        .execute();
    });
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('health_documents')
      .set({ deleted_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }
}
