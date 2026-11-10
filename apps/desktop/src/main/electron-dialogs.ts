import { BrowserWindow, dialog } from 'electron';
import type { BackupDialogs } from '../modules/backup/ports/backup-ports';

/** Native Windows dialogs for backups; paths never come from the renderer. */
export const electronDialogs: BackupDialogs = {
  async chooseSavePath(defaultFileName) {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
      title: 'Salvar backup do Evully',
      defaultPath: defaultFileName,
      filters: [{ name: 'Backup do Evully', extensions: ['zip'] }],
    };
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options);
    return result.canceled || !result.filePath ? null : result.filePath;
  },
  async chooseDirectory() {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
      title: 'Escolher pasta para cópias do backup',
      properties: ['openDirectory', 'createDirectory'] as ('openDirectory' | 'createDirectory')[],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    return result.canceled ? null : (result.filePaths[0] ?? null);
  },
  async chooseBackupFile() {
    const window = BrowserWindow.getFocusedWindow();
    const options = {
      title: 'Escolher backup do Evully para restaurar',
      filters: [{ name: 'Backup do Evully', extensions: ['zip'] }],
      properties: ['openFile'] as 'openFile'[],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    return result.canceled ? null : (result.filePaths[0] ?? null);
  },
};
