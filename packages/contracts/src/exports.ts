import { z } from 'zod';

/** Export of the current profile (README §14.3): full JSON or a zip of CSVs. */
export const exportFormatSchema = z.enum(['json', 'csv']);

export const exportInputSchema = z.object({ profileId: z.uuid(), format: exportFormatSchema });

/** Name of the saved file; null when the user cancelled the save dialog. */
export const exportResultSchema = z.object({ fileName: z.string() }).nullable();

export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type ExportResult = z.infer<typeof exportResultSchema>;
