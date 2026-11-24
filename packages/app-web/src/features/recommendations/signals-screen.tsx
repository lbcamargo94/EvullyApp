import { useCurrentProfile, useRecommendations } from '@evully/app-core';
import type { RecommendationDto } from '@evully/contracts';
import {
  Card,
  EmptyState,
  GoalIllustration,
  ScreenHeader,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  ShowMoreButton,
  useShowMore,
} from '@evully/ui';
import { sharedMessages } from '../shared/messages.pt-BR';
import { signalText, signalsMessages as m } from './messages.pt-BR';
import { SignalItem } from './signal-item';

const HISTORY_STEP = 10;

function History({ history }: { history: RecommendationDto[] }) {
  const { visible, hidden, showMore } = useShowMore(history, HISTORY_STEP);
  return (
    <Card aria-labelledby="signals-history-title">
      <h2 id="signals-history-title" className="text-heading font-semibold">
        {m.historyTitle}
      </h2>
      {history.length === 0 ? (
        <EmptyState>{m.historyEmpty}</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <TableHeader>{m.columnDate}</TableHeader>
              <TableHeader>{m.columnSignal}</TableHeader>
              <TableHeader>{m.columnStatus}</TableHeader>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap">{m.dayMonth(s.statusOn)}</TableCell>
                <TableCell>{signalText(s).title}</TableCell>
                <TableCell className="text-text-muted">{m.status(s)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
      <ShowMoreButton hidden={hidden} onClick={showMore}>
        {sharedMessages.showMore(Math.min(hidden, HISTORY_STEP))}
      </ShowMoreButton>
    </Card>
  );
}

/** Sinais (README §20.2): open signals with their reasons, then the decisions taken. */
export function SignalsScreen() {
  const { profileId } = useCurrentProfile();
  const { data } = useRecommendations(profileId);
  if (!profileId) return null;
  return (
    <>
      <ScreenHeader title={m.title} description={m.description} />
      <Card aria-labelledby="signals-open-title">
        <h2 id="signals-open-title" className="text-heading font-semibold">
          {m.openTitle}
        </h2>
        {data && data.open.length === 0 ? (
          <EmptyState title={m.emptyTitle} illustration={<GoalIllustration />}>
            {m.empty}
          </EmptyState>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {data?.open.map((s) => (
              <SignalItem key={s.id} profileId={profileId} signal={s} />
            ))}
          </ul>
        )}
      </Card>
      {data && <History history={data.history} />}
    </>
  );
}
