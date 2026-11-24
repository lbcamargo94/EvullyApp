import { useDecideRecommendation } from '@evully/app-core';
import type { RecommendationDto } from '@evully/contracts';
import { Badge, Button } from '@evully/ui';
import { Link } from 'react-router';
import { signalAction, signalText, signalWhy, signalsMessages as m } from './messages.pt-BR';

/**
 * One open signal: what the records show, why it appeared (rule, version and
 * numbers), where to act, and dismiss or snooze. Nothing changes the user's
 * data (README §20.2).
 */
export function SignalItem({
  profileId,
  signal,
  compact = false,
}: {
  profileId: string;
  signal: RecommendationDto;
  compact?: boolean;
}) {
  const decide = useDecideRecommendation(profileId);
  const { title, body } = signalText(signal);
  const action = signalAction[signal.ruleId];
  const titleId = `signal-${signal.id}`;
  return (
    <li aria-labelledby={titleId} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={titleId} className="text-body font-semibold">
          {title}
        </h3>
        <Badge tone={signal.level === 'attention' ? 'caution' : 'neutral'}>
          {m.level[signal.level]}
        </Badge>
      </div>
      <p className="text-body text-text-muted">{body}</p>
      {!compact && (
        <details className="text-caption text-text-muted">
          <summary className="cursor-pointer rounded-sm font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {m.why}
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            {signalWhy(signal).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link to={action.to}>{action.label}</Link>
        </Button>
        {!compact && (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: signal.id, decision: 'snoozed' })}
            >
              {m.snooze}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: signal.id, decision: 'dismissed' })}
            >
              {m.dismiss}
            </Button>
          </>
        )}
      </div>
      {decide.isError && (
        <p role="alert" className="text-caption text-danger">
          {m.failed}
        </p>
      )}
    </li>
  );
}
