import { DomainError } from '@evully/domain';
import type { Result } from '@evully/contracts';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import log from 'electron-log/main';
import {
  ipcChannels,
  type IpcChannel,
  type IpcHandlers,
  type IpcOutput,
} from '../shared/ipc-channels';

/**
 * Registers one handler per declared channel. Input is validated with the
 * channel's schema and only the app's own pages may call (SECURITY.md §2.2).
 */
export function registerIpcHandlers(
  handlers: IpcHandlers,
  isTrustedSender: (url: string) => boolean,
) {
  for (const channel of Object.keys(ipcChannels) as IpcChannel[]) {
    ipcMain.handle(channel, (event, input) =>
      handle(channel, handlers, isTrustedSender, event, input),
    );
  }
}

async function handle<C extends IpcChannel>(
  channel: C,
  handlers: IpcHandlers,
  isTrustedSender: (url: string) => boolean,
  event: IpcMainInvokeEvent,
  rawInput: unknown,
): Promise<Result<IpcOutput<C>>> {
  if (!event.senderFrame || !isTrustedSender(event.senderFrame.url)) {
    log.warn(`ipc rejected: untrusted sender on ${channel}`);
    return { ok: false, error: { code: 'ipc.forbidden', message: 'Origem não permitida.' } };
  }
  const parsed = ipcChannels[channel].input.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: { code: 'ipc.invalid_input', message: 'Dados inválidos.' } };
  }
  try {
    const handler = handlers[channel] as (input: unknown) => Promise<IpcOutput<C>> | IpcOutput<C>;
    return { ok: true, data: await handler(parsed.data) };
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    log.error(`ipc failed on ${channel}`, error);
    return { ok: false, error: { code: 'internal', message: 'Erro inesperado.' } };
  }
}
