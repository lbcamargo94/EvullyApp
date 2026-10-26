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
    legal: () => call('app:legal', undefined),
  },
  profiles: {
    list: () => call('profiles:list', undefined),
    get: (id) => call('profiles:get', { id }),
    create: (input) => call('profiles:create', input),
    update: (input) => call('profiles:update', input),
    listArchived: () => call('profiles:list-archived', undefined),
    archive: (id) => call('profiles:archive', { id }),
    restore: (id) => call('profiles:restore', { id }),
    deletePermanently: (input) => call('profiles:delete-permanently', input),
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
  foods: {
    list: () => call('foods:list', undefined),
    create: (input) => call('foods:create', input),
    update: (input) => call('foods:update', input),
    remove: (id) => call('foods:remove', { id }),
  },
  nutrition: {
    day: (profileId, date) => call('nutrition:day', { profileId, date }),
    add: (input) => call('nutrition:add', input),
    updateQuantity: (profileId, id, quantity) =>
      call('nutrition:update-quantity', { profileId, id, quantity }),
    setConsumed: (profileId, id, consumed) =>
      call('nutrition:set-consumed', { profileId, id, consumed }),
    setMealConsumed: (input) => call('nutrition:set-meal-consumed', input),
    remove: (profileId, id) => call('nutrition:remove', { profileId, id }),
    copyMeal: (input) => call('nutrition:copy-meal', input),
  },
  nutritionPreferences: {
    get: (profileId) => call('nutrition-preferences:get', { profileId }),
    answer: (input) => call('nutrition-preferences:answer', input),
    skip: (profileId) => call('nutrition-preferences:skip', { profileId }),
  },
  nutritionTargets: {
    current: (profileId) => call('nutrition-targets:current', { profileId }),
    set: (input) => call('nutrition-targets:set', input),
  },
  water: {
    add: (input) => call('water:add', input),
    remove: (profileId, id) => call('water:remove', { profileId, id }),
  },
  exercises: {
    list: (profileId) => call('exercises:list', { profileId }),
    create: (input) => call('exercises:create', input),
    update: (input) => call('exercises:update', input),
    deactivate: (profileId, id) => call('exercises:deactivate', { profileId, id }),
  },
  workoutPlans: {
    list: (profileId) => call('workout-plans:list', { profileId }),
    create: (profileId, name) => call('workout-plans:create', { profileId, name }),
    update: (profileId, id, values) => call('workout-plans:update', { profileId, id, ...values }),
    importTemplate: (profileId, template) =>
      call('workout-plans:import-template', { profileId, template }),
    addDay: (profileId, planId, day) => call('workout-days:add', { profileId, planId, ...day }),
    updateDay: (profileId, id, day) => call('workout-days:update', { profileId, id, ...day }),
    removeDay: (profileId, id) => call('workout-days:remove', { profileId, id }),
    moveDay: (profileId, id, direction) => call('workout-days:move', { profileId, id, direction }),
    addExercise: (profileId, dayId, exerciseId, prescription) =>
      call('plan-exercises:add', { profileId, dayId, exerciseId, prescription }),
    updateExercise: (profileId, id, prescription) =>
      call('plan-exercises:update', { profileId, id, prescription }),
    removeExercise: (profileId, id) => call('plan-exercises:remove', { profileId, id }),
    moveExercise: (profileId, id, direction) =>
      call('plan-exercises:move', { profileId, id, direction }),
  },
  workoutSessions: {
    open: (profileId) => call('workout-sessions:open', { profileId }),
    start: (profileId, workoutDayId) => call('workout-sessions:start', { profileId, workoutDayId }),
    finish: (profileId, id, notes) => call('workout-sessions:finish', { profileId, id, notes }),
    discard: (profileId, id) => call('workout-sessions:discard', { profileId, id }),
    updateSet: (profileId, id, values) => call('workout-sets:update', { profileId, id, ...values }),
    addSet: (profileId, performanceId) => call('workout-sets:add', { profileId, performanceId }),
    removeSet: (profileId, id) => call('workout-sets:remove', { profileId, id }),
    addExercise: (profileId, sessionId, exerciseId) =>
      call('workout-performances:add', { profileId, sessionId, exerciseId }),
    replaceExercise: (profileId, id, exerciseId) =>
      call('workout-performances:replace', { profileId, id, exerciseId }),
    removeExercise: (profileId, id) => call('workout-performances:remove', { profileId, id }),
  },
  mealTemplates: {
    list: (profileId) => call('meal-templates:list', { profileId }),
    save: (input) => call('meal-templates:save', input),
    apply: (input) => call('meal-templates:apply', input),
    remove: (profileId, id) => call('meal-templates:remove', { profileId, id }),
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
