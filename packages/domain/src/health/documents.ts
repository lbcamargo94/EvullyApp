import { ValidationError } from '../errors';

/**
 * The laboratory PDF kept with an exam (README §24.2). The app stores it as it
 * is and never reads what it says; it only checks the size and that the file
 * starts like a PDF.
 */
export const HEALTH_PDF_MAX_BYTES = 10 * 1024 * 1024;

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/** Throws `health.document_too_large`, `health.document_empty` or `health.document_not_pdf`. */
export function checkHealthPdf(bytes: Uint8Array): void {
  if (bytes.length === 0) throw new ValidationError('health.document_empty', 'Empty file');
  if (bytes.length > HEALTH_PDF_MAX_BYTES)
    throw new ValidationError('health.document_too_large', 'PDF over 10 MB');
  if (!PDF_HEADER.every((byte, i) => bytes[i] === byte))
    throw new ValidationError('health.document_not_pdf', 'Not a PDF file');
}

/** A file name safe to show and to offer in a save dialog: no folders, at most 120 characters. */
export function healthDocumentFileName(name: string): string {
  const base = name.split(/[\\/]/).pop()?.trim() ?? '';
  const clean = [...base]
    .map((c) => (c.charCodeAt(0) < 32 || '<>:"|?*'.includes(c) ? '_' : c))
    .join('')
    .slice(0, 120);
  return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean || 'exame'}.pdf`;
}
