import type { ImportKind } from '@evully/contracts';
import type { ImportPlan, MeasurementImportRow, WeightImportRow } from '@evully/domain';
import { NotFoundError } from '@evully/domain';

export type PendingImport =
  | { kind: 'weights'; profileId: string; plan: ImportPlan<WeightImportRow> }
  | {
      kind: 'measurements';
      profileId: string;
      plan: ImportPlan<MeasurementImportRow> & { typeIds: string[] };
    };

/**
 * Previews waiting for confirmation, kept in memory only. A preview is used
 * once and only by the profile that created it.
 */
export class PendingImports {
  private readonly items = new Map<string, PendingImport>();

  put(token: string, item: PendingImport): void {
    this.items.clear(); // one import at a time
    this.items.set(token, item);
  }

  take(token: string, profileId: string, kind?: ImportKind): PendingImport {
    const item = this.items.get(token);
    if (!item || item.profileId !== profileId || (kind && item.kind !== kind)) {
      throw new NotFoundError('import.expired', 'Import preview not found');
    }
    this.items.delete(token);
    return item;
  }

  discard(token: string): void {
    this.items.delete(token);
  }
}
