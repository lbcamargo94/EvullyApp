import { useRecommendations } from '@evully/app-core';
import { Card } from '@evully/ui';
import { Link } from 'react-router';
import { signalsMessages as m } from './messages.pt-BR';
import { SignalItem } from './signal-item';

const SHOWN = 3;

/** Dashboard: the newest open signals; hidden when there are none (README §20.2). */
export function SignalsCard({ profileId }: { profileId: string }) {
  const { data } = useRecommendations(profileId);
  const open = data?.open ?? [];
  if (open.length === 0) return null;
  const hidden = open.length - SHOWN;
  return (
    <Card aria-labelledby="signals-card-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="signals-card-title" className="text-heading font-semibold">
          {m.cardTitle}
        </h2>
        <Link
          to="/app/signals"
          className="rounded-sm text-body font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {hidden > 0 ? `${m.seeAll} (${m.more(hidden)})` : m.seeAll}
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border/60">
        {open.slice(0, SHOWN).map((s) => (
          <SignalItem key={s.id} profileId={profileId} signal={s} compact />
        ))}
      </ul>
    </Card>
  );
}
