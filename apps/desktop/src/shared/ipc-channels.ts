import {
  acceptTrackingInputSchema,
  createTagInputSchema,
  appInfoSchema,
  appSettingsSchema,
  profileIdInputSchema,
  profileInputSchema,
  profileScopedInputSchema,
  profileSchema,
  profileSummarySchema,
  projectSchema,
  tagSchema,
  trackingStateSchema,
  updateWeightInputSchema,
  weightEntrySchema,
  weightIdInputSchema,
  weightInputSchema,
  weightSummarySchema,
  updateAppSettingsInputSchema,
  updateProfileInputSchema,
} from '@evully/contracts';
import { z } from 'zod';

/**
 * Every IPC channel the renderer may call, with its input and output schemas
 * (README §5.5). Channels are named `<module>:<action>`.
 */
export const ipcChannels = {
  'app:info': { input: z.undefined(), output: appInfoSchema },
  'profiles:list': { input: z.undefined(), output: z.array(profileSummarySchema) },
  'profiles:get': { input: profileIdInputSchema, output: profileSchema },
  'profiles:create': { input: profileInputSchema, output: profileSchema },
  'profiles:update': { input: updateProfileInputSchema, output: profileSchema },
  'settings:get': { input: z.undefined(), output: appSettingsSchema },
  'settings:update': { input: updateAppSettingsInputSchema, output: appSettingsSchema },
  'settings:accept-health-notice': { input: z.undefined(), output: appSettingsSchema },
  'tracking:get-state': { input: profileScopedInputSchema, output: trackingStateSchema },
  'tracking:accept': { input: acceptTrackingInputSchema, output: trackingStateSchema },
  'tracking:skip': { input: profileScopedInputSchema, output: trackingStateSchema },
  'projects:get-active': { input: profileScopedInputSchema, output: projectSchema.nullable() },
  'weights:list': { input: profileScopedInputSchema, output: z.array(weightEntrySchema) },
  'weights:summary': { input: profileScopedInputSchema, output: weightSummarySchema },
  'weights:register': { input: weightInputSchema, output: weightEntrySchema },
  'weights:update': { input: updateWeightInputSchema, output: weightEntrySchema },
  'weights:delete': { input: weightIdInputSchema, output: z.null() },
  'tags:list': { input: profileScopedInputSchema, output: z.array(tagSchema) },
  'tags:create': { input: createTagInputSchema, output: tagSchema },
} as const;

export type IpcChannel = keyof typeof ipcChannels;
export type IpcInput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['input']>;
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['output']>;

export type IpcHandlers = {
  [C in IpcChannel]: (input: IpcInput<C>) => Promise<IpcOutput<C>> | IpcOutput<C>;
};
