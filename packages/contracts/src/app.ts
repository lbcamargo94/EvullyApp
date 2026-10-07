import { z } from 'zod';

export const appInfoSchema = z.object({
  version: z.string(),
  environment: z.enum(['development', 'production']),
});

export type AppInfo = z.infer<typeof appInfoSchema>;
