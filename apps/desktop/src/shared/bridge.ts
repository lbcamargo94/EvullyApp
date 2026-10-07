import type { Result } from '@evully/contracts';
import type { IpcChannel, IpcInput, IpcOutput } from './ipc-channels';

/** API exposed by the preload script as `window.evully`. */
export interface EvullyBridge {
  invoke<C extends IpcChannel>(channel: C, input: IpcInput<C>): Promise<Result<IpcOutput<C>>>;
}
