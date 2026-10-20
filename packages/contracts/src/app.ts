import { z } from 'zod';

export const appInfoSchema = z.object({
  version: z.string(),
  environment: z.enum(['development', 'production']),
});

/** Texts shown in Settings › Sobre; read by the main process from the app resources. */
export const legalDocumentsSchema = z.object({
  license: z.string(),
  thirdPartyNotices: z.string(),
});

export type AppInfo = z.infer<typeof appInfoSchema>;
export type LegalDocuments = z.infer<typeof legalDocumentsSchema>;
