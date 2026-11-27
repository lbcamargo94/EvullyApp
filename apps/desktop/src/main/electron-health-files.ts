import { checkHealthPdf, HEALTH_PDF_MAX_BYTES, ValidationError } from '@evully/domain';
import { BrowserWindow, dialog, shell, type OpenDialogOptions } from 'electron';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { HealthDocumentFiles } from '../modules/health/ports/health-repository';
import { choosePath } from './electron-export-files';

const pdfFilter = [{ name: 'PDF', extensions: ['pdf'] }];

/**
 * Exam PDFs (README §24.2): chosen and saved through system dialogs, opened
 * from copies in a private temp folder that `clearHealthViewerCopies` empties
 * on start and on close. Paths never come from the renderer.
 */
export function electronHealthFiles(viewerDirectory: string): HealthDocumentFiles {
  return {
    async choosePdf() {
      const window = BrowserWindow.getFocusedWindow();
      const options: OpenDialogOptions = {
        title: 'Anexar o PDF do exame',
        filters: pdfFilter,
        properties: ['openFile'],
      };
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options);
      const path = result.canceled ? undefined : result.filePaths[0];
      if (!path) return null;
      if ((await stat(path)).size > HEALTH_PDF_MAX_BYTES)
        throw new ValidationError('health.document_too_large', 'PDF over 10 MB');
      const bytes = new Uint8Array(await readFile(path));
      checkHealthPdf(bytes);
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      return { fileName: basename(path), bytes, sha256 };
    },

    async saveCopy(fileName, bytes) {
      const path = await choosePath({
        title: 'Salvar cópia do PDF',
        defaultPath: fileName,
        filters: pdfFilter,
      });
      if (!path) return false;
      await writeFile(path, bytes);
      return true;
    },

    async open(fileName, bytes) {
      // A folder per opening keeps the original name without clashing.
      const folder = join(
        viewerDirectory,
        createHash('sha256').update(bytes).digest('hex').slice(0, 16),
      );
      await mkdir(folder, { recursive: true });
      const path = join(folder, basename(fileName));
      await writeFile(path, bytes);
      const error = await shell.openPath(path);
      if (error) throw new ValidationError('health.document_open_failed', 'No PDF viewer');
    },
  };
}

/** Removes the viewer copies; never throws, so it cannot block start or close. */
export async function clearHealthViewerCopies(viewerDirectory: string): Promise<void> {
  await rm(viewerDirectory, { recursive: true, force: true }).catch(() => undefined);
}
