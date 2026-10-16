import { ValidationError } from '@evully/domain';
import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { ImportFiles } from '../modules/imports/ports/import-ports';

/** CSVs above this size are refused before being read (README §8.8). */
const MAX_CSV_BYTES = 2 * 1024 * 1024;
const csvFilter = [{ name: 'Planilha CSV', extensions: ['csv', 'txt'] }];

/** Native dialogs and file access for CSV import; paths never come from the renderer. */
export const electronImportFiles: ImportFiles = {
  async chooseCsv() {
    const window = BrowserWindow.getFocusedWindow();
    const options: OpenDialogOptions = {
      title: 'Escolher arquivo CSV',
      filters: csvFilter,
      properties: ['openFile'],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    const path = result.canceled ? undefined : result.filePaths[0];
    if (!path) return null;
    if ((await stat(path)).size > MAX_CSV_BYTES) {
      throw new ValidationError('import.too_large', 'CSV file is too large');
    }
    return { fileName: basename(path), text: await readFile(path, 'utf8') };
  },

  async saveText(defaultFileName, content) {
    const window = BrowserWindow.getFocusedWindow();
    const options = { title: 'Salvar modelo', defaultPath: defaultFileName, filters: csvFilter };
    const result = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return false;
    await writeFile(result.filePath, content, 'utf8');
    return true;
  },
};
