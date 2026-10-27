import { z } from 'zod';

/** `prerelease` also installs alphas; `stable` only stable versions (README §33). */
export const updateChannelSchema = z.enum(['prerelease', 'stable']);

export const updateStatusSchema = z.object({
  /** `disabled` in development builds. */
  state: z.enum(['disabled', 'idle', 'checking', 'up_to_date', 'downloading', 'ready', 'error']),
  currentVersion: z.string(),
  availableVersion: z.string().nullable(),
  /** Download progress, 0–100. */
  progress: z.number().nullable(),
  /** Last finished check, ISO UTC. */
  checkedAt: z.string().nullable(),
  error: z.enum(['network', 'signature', 'unknown']).nullable(),
});

export type UpdateChannel = z.infer<typeof updateChannelSchema>;
export type UpdateStatus = z.infer<typeof updateStatusSchema>;
