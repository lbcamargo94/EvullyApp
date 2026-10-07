import { useCurrentProfile, useProfile } from '@evully/app-core';
import { Card } from '@evully/ui';
import { shellMessages as m } from './messages.pt-BR';

/** Placeholder until the V0.1 dashboard (README §8.5) is built. */
export function HomeScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  if (!profile) return null;
  return (
    <Card>
      <h1 className="text-[26px] font-semibold tracking-tight">{m.homeTitle(profile.name)}</h1>
      <p className="text-text-muted">{m.homeBody}</p>
    </Card>
  );
}
