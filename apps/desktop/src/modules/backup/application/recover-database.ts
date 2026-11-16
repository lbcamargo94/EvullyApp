import { damagedDatabaseFileName } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { DamagedDatabase } from '../ports/backup-ports';
import type { PendingRestore, RestoreSource } from './restore-backup';

/** Recovery mode: the database is damaged, so only backups and the data folder are used. */
export interface RecoveryDeps extends RestoreSource {
  damaged: DamagedDatabase;
  clock: Clock;
}

/**
 * Restores a validated backup over a damaged database (README §14.2.1): keeps
 * a copy of the damaged file (a pre-restore backup is impossible), stages the
 * backup and restarts; the swap happens on the next start.
 */
export class ConfirmRecovery {
  constructor(
    private readonly deps: RecoveryDeps,
    private readonly pending: PendingRestore,
  ) {}

  async execute({ token }: { token: string }): Promise<null> {
    const databaseFile = this.pending.take(token);
    const { damaged, clock, reader } = this.deps;
    try {
      const name = damagedDatabaseFileName(
        clock.today(),
        clock.localTime(),
        await damaged.existingNames(),
      );
      await damaged.keepCopy(name);
      await reader.stage(databaseFile);
    } catch (error) {
      await reader.discard(databaseFile);
      throw error;
    }
    this.deps.restart.restart();
    return null;
  }
}
