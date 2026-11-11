import AdmZip from 'adm-zip';
import { BrowserWindow, dialog, type SaveDialogOptions } from 'electron';
import { writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { ExportFiles } from '../modules/exports/ports/export-ports';

/** Native save dialog; the dialog itself asks before replacing an existing file. */
export async function choosePath(options: SaveDialogOptions): Promise<string | null> {
  const window = BrowserWindow.getFocusedWindow();
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);
  return result.canceled || !result.filePath ? null : result.filePath;
}

/** Writes the export files (README §14.3); paths never come from the renderer. */
export const electronExportFiles: ExportFiles = {
  async saveJson(defaultFileName, content) {
    const path = await choosePath({
      title: 'Exportar dados (JSON)',
      defaultPath: defaultFileName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return null;
    await writeFile(path, content, 'utf8');
    return basename(path);
  },

  async saveZip(defaultFileName, files) {
    const path = await choosePath({
      title: 'Exportar dados (CSV)',
      defaultPath: defaultFileName,
      filters: [{ name: 'Arquivo zip', extensions: ['zip'] }],
    });
    if (!path) return null;
    const zip = new AdmZip();
    for (const [name, content] of Object.entries(files))
      zip.addFile(name, Buffer.from(content, 'utf8'));
    await zip.writeZipPromise(path, { overwrite: true });
    return basename(path);
  },
};
