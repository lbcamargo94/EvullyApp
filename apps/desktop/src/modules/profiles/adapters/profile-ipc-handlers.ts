import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { Clock, IdGenerator } from '../../shared/ports';
import {
  ArchiveProfile,
  DeleteProfilePermanently,
  ListArchivedProfiles,
  RestoreProfile,
} from '../application/archive-profiles';
import { CreateProfile } from '../application/create-profile';
import { GetProfile } from '../application/get-profile';
import { ListProfiles } from '../application/list-profiles';
import { UpdateProfile } from '../application/update-profile';
import type { PreDeleteBackup, ProfileRepository } from '../ports/profile-repository';

type ProfileChannels =
  | 'profiles:list'
  | 'profiles:get'
  | 'profiles:create'
  | 'profiles:update'
  | 'profiles:list-archived'
  | 'profiles:archive'
  | 'profiles:restore'
  | 'profiles:delete-permanently';

export function profileIpcHandlers(
  profiles: ProfileRepository,
  clock: Clock,
  ids: IdGenerator,
  preDeleteBackup: PreDeleteBackup,
): Pick<IpcHandlers, ProfileChannels> {
  const create = new CreateProfile(profiles, clock, ids);
  const update = new UpdateProfile(profiles, clock);
  const get = new GetProfile(profiles);
  const list = new ListProfiles(profiles);
  const listArchived = new ListArchivedProfiles(profiles);
  const archive = new ArchiveProfile(profiles, clock);
  const restore = new RestoreProfile(profiles, clock);
  const remove = new DeleteProfilePermanently(profiles, preDeleteBackup);
  return {
    'profiles:list': () => list.execute(),
    'profiles:get': (input) => get.execute(input),
    'profiles:create': (input) => create.execute(input),
    'profiles:update': (input) => update.execute(input),
    'profiles:list-archived': () => listArchived.execute(),
    'profiles:archive': (input) => archive.execute(input),
    'profiles:restore': (input) => restore.execute(input),
    'profiles:delete-permanently': (input) => remove.execute(input),
  };
}
