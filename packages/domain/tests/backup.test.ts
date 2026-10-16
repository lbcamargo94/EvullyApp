import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  backupsToDelete,
  isAutomaticBackupDue,
  parseLocalDate,
  type StoredBackup,
} from '../src';

const d = parseLocalDate;

describe('backupFileName', () => {
  it('follows README §8.7', () => {
    expect(backupFileName(d('2026-10-14'), '07:05')).toBe('evully-backup-2026-10-14-0705.zip');
  });

  it('adds a suffix when the name is taken', () => {
    const taken = new Set([
      'evully-backup-2026-10-14-0705.zip',
      'evully-backup-2026-10-14-0705-2.zip',
    ]);
    expect(backupFileName(d('2026-10-14'), '07:05', taken)).toBe(
      'evully-backup-2026-10-14-0705-3.zip',
    );
  });
});

describe('isAutomaticBackupDue', () => {
  it('runs once per day when enabled', () => {
    expect(isAutomaticBackupDue(true, null, d('2026-10-14'))).toBe(true);
    expect(isAutomaticBackupDue(true, d('2026-10-13'), d('2026-10-14'))).toBe(true);
    expect(isAutomaticBackupDue(true, d('2026-10-14'), d('2026-10-14'))).toBe(false);
  });

  it('never runs when disabled', () => {
    expect(isAutomaticBackupDue(false, null, d('2026-10-14'))).toBe(false);
  });
});

describe('backupsToDelete', () => {
  const auto = (n: number): StoredBackup => ({
    fileName: `auto-${n}.zip`,
    kind: 'automatic',
    createdAt: `2026-10-${String(n).padStart(2, '0')}T10:00:00.000Z`,
  });

  it('keeps the newest automatic backups only', () => {
    const backups = Array.from({ length: 12 }, (_, i) => auto(i + 1));
    expect(backupsToDelete(backups).sort()).toEqual(['auto-1.zip', 'auto-2.zip']);
  });

  it('never deletes manual, pre-migration or unreadable backups', () => {
    const others: StoredBackup[] = [
      { fileName: 'manual.zip', kind: 'manual', createdAt: '2026-01-01T00:00:00.000Z' },
      { fileName: 'pre.zip', kind: 'pre-migration', createdAt: '2026-01-01T00:00:00.000Z' },
      { fileName: 'broken.zip', kind: null, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
    const backups = [...others, ...Array.from({ length: 11 }, (_, i) => auto(i + 1))];
    expect(backupsToDelete(backups)).toEqual(['auto-1.zip']);
  });
});
