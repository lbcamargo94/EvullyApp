import type { IpcHandlers } from '../../../shared/ipc-channels';
import {
  AcceptRecommendation,
  DecideRecommendation,
  GetRecommendationSettings,
  ListRecommendations,
  SetRecommendationSettings,
  type RecommendationDeps,
} from '../application/manage-recommendations';

type RecommendationChannels =
  | 'recommendations:list'
  | 'recommendations:decide'
  | 'recommendations:accept'
  | 'recommendation-settings:get'
  | 'recommendation-settings:set';

export function recommendationIpcHandlers(
  deps: RecommendationDeps,
): Pick<IpcHandlers, RecommendationChannels> {
  return {
    'recommendations:list': (input) => new ListRecommendations(deps).execute(input),
    'recommendations:decide': (input) => new DecideRecommendation(deps).execute(input),
    'recommendations:accept': (input) => new AcceptRecommendation(deps).execute(input),
    'recommendation-settings:get': (input) => new GetRecommendationSettings(deps).execute(input),
    'recommendation-settings:set': (input) => new SetRecommendationSettings(deps).execute(input),
  };
}
