import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron';
import { basename } from 'node:path';
import { readTransferZip, writeTransferZip } from '../modules/transfer/adapters/transfer-zip';
import type { TransferFiles } from '../modules/transfer/ports/transfer-ports';
import { choosePath } from './electron-export-files';

const zipFilter = [{ name: 'Perfil do Evully', extensions: ['zip'] }];

/** Save and open dialogs for the profile transfer (README §14.4); paths stay in main. */
export const electronTransferFiles: TransferFiles = {
  async save(defaultFileName, profileJson, manifest) {
    const path = await choosePath({
      title: 'Exportar perfil para outro computador',
      defaultPath: defaultFileName,
      filters: zipFilter,
    });
    if (!path) return null;
    await writeTransferZip(path, profileJson, manifest);
    return basename(path);
  },

  async open() {
    const window = BrowserWindow.getFocusedWindow();
    const options: OpenDialogOptions = {
      title: 'Importar perfil do Evully',
      filters: zipFilter,
      properties: ['openFile'],
    };
    const result = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);
    const path = result.canceled ? undefined : result.filePaths[0];
    return path ? readTransferZip(path) : null;
  },
};
