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
  profiles: {
    list: () => call('profiles:list', undefined),
    get: (id) => call('profiles:get', { id }),
    create: (input) => call('profiles:create', input),
    update: (input) => call('profiles:update', input),
  },
  settings: {
    get: () => call('settings:get', undefined),
    update: (input) => call('settings:update', input),
    acceptHealthNotice: () => call('settings:accept-health-notice', undefined),
  },
  tracking: {
    getState: (profileId) => call('tracking:get-state', { profileId }),
    accept: (input) => call('tracking:accept', input),
    skip: (profileId) => call('tracking:skip', { profileId }),
    catalog: () => call('tracking:catalog', undefined),
    setWeightDisplay: (profileId, weightDisplay) =>
      call('tracking:set-weight-display', { profileId, weightDisplay }),
    setMeasurements: (profileId, measurementTypeIds) =>
      call('tracking:set-measurements', { profileId, measurementTypeIds }),
  },
  projects: {
    getActive: (profileId) => call('projects:get-active', { profileId }),
    list: (profileId) => call('projects:list', { profileId }),
    create: (input) => call('projects:create', input),
    update: (input) => call('projects:update', input),
    complete: (profileId, id) => call('projects:complete', { profileId, id }),
  },
  weights: {
    list: (profileId) => call('weights:list', { profileId }),
    summary: (profileId) => call('weights:summary', { profileId }),
    register: (input) => call('weights:register', input),
    update: (input) => call('weights:update', input),
    remove: (profileId, id) => call('weights:delete', { profileId, id }),
  },
  measurements: {
    list: (profileId) => call('measurements:list', { profileId }),
    summary: (profileId) => call('measurements:summary', { profileId }),
    register: (input) => call('measurements:register', input),
    update: (input) => call('measurements:update', input),
    remove: (profileId, id) => call('measurements:delete', { profileId, id }),
  },
  tags: {
    list: (profileId) => call('tags:list', { profileId }),
    create: (input) => call('tags:create', input),
    rename: (input) => call('tags:rename', input),
    remove: (profileId, id) => call('tags:remove', { profileId, id }),
  },
  imports: {
    preview: (profileId, kind) => call('import:preview', { profileId, kind }),
    confirm: (profileId, token) => call('import:confirm', { profileId, token }),
    cancel: (profileId, token) => call('import:cancel', { profileId, token }),
    saveTemplate: (profileId, kind) => call('import:template', { profileId, kind }),
  },
  backup: {
    status: () => call('backup:status', undefined),
    createManual: () => call('backup:create-manual', undefined),
    setAutomatic: (automaticEnabled) => call('backup:set-automatic', { automaticEnabled }),
    chooseExtraDirectory: (clear) => call('backup:choose-extra-directory', { clear }),
    dismissError: () => call('backup:dismiss-error', undefined),
  },
};
