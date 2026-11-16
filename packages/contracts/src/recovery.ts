import { z } from 'zod';

/** Whether the app started in recovery mode because its database is damaged (README §14.2.1). */
export const recoveryStatusSchema = z.object({ damaged: z.boolean() });

export type RecoveryStatus = z.infer<typeof recoveryStatusSchema>;
