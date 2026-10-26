import { Button } from '@evully/ui';
import { Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sessionMessages as m } from './messages.pt-BR';

const label = (total: number) => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/** Countdown for the rest between sets; it only shows time, it never saves anything. */
export function RestTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = window.setTimeout(() => setLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  if (left === null) {
    return (
      <Button type="button" variant="secondary" onClick={() => setLeft(seconds)}>
        <Timer aria-hidden="true" className="size-4" />
        {m.rest(label(seconds))}
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span role="timer" aria-live="polite" className="text-2xl font-semibold tabular-nums">
        {left > 0 ? m.resting(label(left)) : m.restDone}
      </span>
      <Button type="button" variant="ghost" onClick={() => setLeft(null)}>
        {m.stop}
      </Button>
    </div>
  );
}
