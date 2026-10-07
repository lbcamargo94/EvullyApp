import type { EvullyClient } from '@evully/app-core';
import type { EvullyBridge } from '../shared/bridge';
import type { IpcChannel, IpcInput, IpcOutput } from '../shared/ipc-channels';

declare global {
  interface Window {
    evully: EvullyBridge;
  }
}

/** Error raised in the renderer when the main process returns `{ ok: false }`. */
export class IpcError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<C extends IpcChannel>(channel: C, input: IpcInput<C>): Promise<IpcOutput<C>> {
  const result = await window.evully.invoke(channel, input);
  if (!result.ok) throw new IpcError(result.error.code, result.error.message);
  return result.data;
}

/** Desktop implementation of the screens' data port (FRONTEND.md §3.2). */
export const ipcEvullyClient: EvullyClient = {
  app: {
    info: () => call('app:info', undefined),
  },
};
