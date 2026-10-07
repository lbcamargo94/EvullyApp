import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { Clock, IdGenerator } from '../../shared/ports';
import { CreateProfile } from '../application/create-profile';
import { GetProfile } from '../application/get-profile';
import { ListProfiles } from '../application/list-profiles';
import { UpdateProfile } from '../application/update-profile';
import type { ProfileRepository } from '../ports/profile-repository';

type ProfileChannels = 'profiles:list' | 'profiles:get' | 'profiles:create' | 'profiles:update';

export function profileIpcHandlers(
  profiles: ProfileRepository,
  clock: Clock,
  ids: IdGenerator,
): Pick<IpcHandlers, ProfileChannels> {
  const create = new CreateProfile(profiles, clock, ids);
  const update = new UpdateProfile(profiles, clock);
  const get = new GetProfile(profiles);
  const list = new ListProfiles(profiles);
  return {
    'profiles:list': () => list.execute(),
    'profiles:get': (input) => get.execute(input),
    'profiles:create': (input) => create.execute(input),
    'profiles:update': (input) => update.execute(input),
  };
}
