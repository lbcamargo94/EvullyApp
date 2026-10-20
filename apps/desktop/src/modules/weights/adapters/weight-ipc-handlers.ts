import type { WeightEntry } from '@evully/contracts';
import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ProjectRepository } from '../../tracking/ports/project-repository';
import { CreateTag } from '../application/create-tag';
import { DeleteWeight } from '../application/delete-weight';
import { GetWeightSummary } from '../application/get-weight-summary';
import { ListTags, ListWeights } from '../application/list-weights';
import { RemoveTag, RenameTag } from '../application/manage-tags';
import { RegisterWeight } from '../application/register-weight';
import { UpdateWeight } from '../application/update-weight';
import type {
  TagRepository,
  WeightEntryRecord,
  WeightRepository,
} from '../ports/weight-repository';

type WeightChannels =
  | 'weights:list'
  | 'weights:summary'
  | 'weights:register'
  | 'weights:update'
  | 'weights:delete'
  | 'tags:list'
  | 'tags:create'
  | 'tags:rename'
  | 'tags:remove';

/** What the screens receive: no profile id or audit timestamps. */
const toDto = (record: WeightEntryRecord): WeightEntry => ({
  id: record.id,
  measuredOn: record.measuredOn,
  measuredAt: record.measuredAt,
  weightKg: record.weightKg,
  notes: record.notes,
  tags: record.tags,
});

export function weightIpcHandlers(deps: {
  profiles: ProfileRepository;
  projects: ProjectRepository;
  weights: WeightRepository;
  tags: TagRepository;
  clock: Clock;
  ids: IdGenerator;
}): Pick<IpcHandlers, WeightChannels> {
  const { profiles, projects, weights, tags, clock, ids } = deps;
  const list = new ListWeights(weights);
  const listTags = new ListTags(tags);
  const register = new RegisterWeight(profiles, weights, tags, clock, ids);
  const update = new UpdateWeight(weights, tags, clock);
  const remove = new DeleteWeight(weights, clock);
  const summary = new GetWeightSummary(weights, projects, clock);
  const createTag = new CreateTag(profiles, tags, clock, ids);
  const renameTag = new RenameTag(tags, clock);
  const removeTag = new RemoveTag(tags, clock);
  return {
    'weights:list': async (input) => (await list.execute(input)).map(toDto),
    'weights:summary': (input) => summary.execute(input),
    'weights:register': async (input) => toDto(await register.execute(input)),
    'weights:update': async (input) => toDto(await update.execute(input)),
    'weights:delete': (input) => remove.execute(input),
    'tags:list': (input) => listTags.execute(input),
    'tags:create': (input) => createTag.execute(input),
    'tags:rename': (input) => renameTag.execute(input),
    'tags:remove': (input) => removeTag.execute(input),
  };
}
