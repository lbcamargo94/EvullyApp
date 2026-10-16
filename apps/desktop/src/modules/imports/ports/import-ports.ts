/** Native file dialogs + file access for imports; the renderer never sends paths. */
export interface ImportFiles {
  /** Lets the user pick a CSV and reads it (UTF-8). Null if cancelled. */
  chooseCsv(): Promise<{ fileName: string; text: string } | null>;
  /** Lets the user pick where to save `content`. False if cancelled. */
  saveText(defaultFileName: string, content: string): Promise<boolean>;
}
