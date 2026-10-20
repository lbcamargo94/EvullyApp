import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import { AcceptTracking } from '../application/accept-tracking';
import { GetActiveProject } from '../application/get-active-project';
import { GetTrackingState } from '../application/get-tracking-state';
import {
  CompleteProject,
  CreateProject,
  ListProjects,
  UpdateProject,
} from '../application/manage-projects';
import { SkipTracking } from '../application/skip-tracking';
import {
  ListMeasurementCatalog,
  SetTrackedMeasurements,
  SetWeightDisplay,
} from '../application/tracking-preferences';
import type { ProjectRepository } from '../ports/project-repository';
import type { TrackingRepository } from '../ports/tracking-repository';

type TrackingChannels =
  | 'tracking:get-state'
  | 'tracking:accept'
  | 'tracking:skip'
  | 'tracking:catalog'
  | 'tracking:set-weight-display'
  | 'tracking:set-measurements'
  | 'projects:get-active'
  | 'projects:list'
  | 'projects:create'
  | 'projects:update'
  | 'projects:complete';

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
  const setWeightDisplay = new SetWeightDisplay(tracking, clock, ids);
  const setMeasurements = new SetTrackedMeasurements(tracking, clock);
  const catalog = new ListMeasurementCatalog(tracking);
  const createProject = new CreateProject(profiles, projects, clock, ids);
  const updateProject = new UpdateProject(projects, clock);
  const completeProject = new CompleteProject(projects, clock);
  const listProjects = new ListProjects(projects);
  const thenState = async (profileId: string, run: Promise<unknown>) => {
    await run;
    return getState.execute({ profileId });
  };
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
    'tracking:catalog': () => catalog.execute(),
    'tracking:set-weight-display': (input) =>
      thenState(input.profileId, setWeightDisplay.execute(input)),
    'tracking:set-measurements': (input) =>
      thenState(input.profileId, setMeasurements.execute(input)),
    'projects:list': (input) => listProjects.execute(input),
    'projects:create': (input) => createProject.execute(input),
    'projects:update': (input) => updateProject.execute(input),
    'projects:complete': (input) => completeProject.execute(input),
  };
}
