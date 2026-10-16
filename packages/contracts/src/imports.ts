import { z } from 'zod';

export const importKindSchema = z.enum(['weights', 'measurements']);

export const importRequestSchema = z.object({ profileId: z.uuid(), kind: importKindSchema });
export const importTokenInputSchema = z.object({ profileId: z.uuid(), token: z.uuid() });

/** Rows shown in the preview; at most this many are sent to the screen. */
export const IMPORT_PREVIEW_ROWS = 500;

/** Result of reading a CSV, before anything is written (README §8.8). */
export const importPreviewSchema = z.object({
  token: z.string(),
  kind: importKindSchema,
  fileName: z.string(),
  /** File-level problem; when set nothing can be imported. */
  fileError: z.string().nullable(),
  counts: z.object({ ready: z.number(), duplicates: z.number(), errors: z.number() }),
  rows: z.array(
    z.object({
      line: z.number(),
      status: z.enum(['ready', 'duplicate', 'error']),
      code: z.string().nullable(),
      measuredOn: z.string().nullable(),
      time: z.string().nullable(),
      weightKg: z.number().nullable(),
      values: z.array(z.object({ name: z.string(), valueCm: z.number() })),
    }),
  ),
  /** Measurements the profile does not track yet that the import will turn on. */
  newMeasurementTypes: z.array(z.string()),
});

export const importResultSchema = z.object({ imported: z.number() });

export type ImportKind = z.infer<typeof importKindSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export type ImportPreviewRow = ImportPreview['rows'][number];
export type ImportResult = z.infer<typeof importResultSchema>;
