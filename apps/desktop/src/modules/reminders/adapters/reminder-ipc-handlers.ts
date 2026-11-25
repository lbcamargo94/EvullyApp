import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  GetReminderSettings,
  SetReminderSettings,
  type ReminderDeps,
} from '../application/manage-reminders';
import type { ReminderOpenBox } from './reminder-open-box';

type ReminderChannels = 'reminders:get' | 'reminders:set' | 'reminders:take-open';

export function reminderIpcHandlers(
  deps: ReminderDeps & { opens: ReminderOpenBox; onChange: () => void },
): Pick<IpcHandlers, ReminderChannels> {
  return {
    'reminders:get': (input) => new GetReminderSettings(deps).execute(input),
    'reminders:set': async (input) => {
      const settings = await new SetReminderSettings(deps).execute(input);
      deps.onChange();
      return settings;
    },
    'reminders:take-open': async () => deps.opens.take(),
  };
}
