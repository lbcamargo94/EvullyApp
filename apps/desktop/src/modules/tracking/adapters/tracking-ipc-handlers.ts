import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import { AcceptTracking } from '../application/accept-tracking';
import { GetActiveProject } from '../application/get-active-project';
import { GetTrackingState } from '../application/get-tracking-state';
import { SkipTracking } from '../application/skip-tracking';
import type { ProjectRepository } from '../ports/project-repository';
import type { TrackingRepository } from '../ports/tracking-repository';

type TrackingChannels =
  'tracking:get-state' | 'tracking:accept' | 'tracking:skip' | 'projects:get-active';

export function trackingIpcHandlers(deps: {
  profiles: ProfileRepository;
  projects: ProjectRepository;
  tracking: TrackingRepository;
  clock: Clock;
  ids: IdGenerator;
}): Pick<IpcHandlers, TrackingChannels> {
  const { profiles, projects, tracking, clock, ids } = deps;
  const getState = new GetTrackingState(tracking, clock);
  const accept = new AcceptTracking(profiles, projects, tracking, clock, ids);
  const skip = new SkipTracking(profiles, tracking, clock, ids);
  const activeProject = new GetActiveProject(projects);
  return {
    'tracking:get-state': (input) => getState.execute(input),
    'tracking:accept': async (input) => {
      await accept.execute(input);
      return getState.execute(input);
    },
    'tracking:skip': async (input) => {
      await skip.execute(input);
      return getState.execute(input);
    },
    'projects:get-active': (input) => activeProject.execute(input),
  };
}
