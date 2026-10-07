import { appInfoSchema } from '@evully/contracts';
import { z } from 'zod';

/**
 * Every IPC channel the renderer may call, with its input and output schemas
 * (README §5.5). Channels are named `<module>:<action>`.
 */
export const ipcChannels = {
  'app:info': { input: z.undefined(), output: appInfoSchema },
} as const;

export type IpcChannel = keyof typeof ipcChannels;
export type IpcInput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['input']>;
export type IpcOutput<C extends IpcChannel> = z.infer<(typeof ipcChannels)[C]['output']>;
