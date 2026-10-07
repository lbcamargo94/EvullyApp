import {
  appInfoSchema,
  appSettingsSchema,
  profileIdInputSchema,
  profileInputSchema,
  profileSchema,
  profileSummarySchema,
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
} as const;

export type IpcChannel = keyof typeof ipcChannels;
export type IpcInput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['input']>;
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['output']>;

export type IpcHandlers = {
  [C in IpcChannel]: (input: IpcInput<C>) => Promise<IpcOutput<C>> | IpcOutput<C>;
};
