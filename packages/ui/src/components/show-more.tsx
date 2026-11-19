import { useState, type ReactNode } from 'react';
import { Button } from './button';

/**
 * Long histories show the most recent `step` items first and grow by `step`
 * on request. Only what is on screen changes; the data stays as it is.
 */
export function useShowMore<T>(items: readonly T[], step: number) {
  const [limit, setLimit] = useState(step);
  return {
    visible: items.slice(0, limit),
    hidden: Math.max(0, items.length - limit),
    showMore: () => setLimit((current) => current + step),
  };
}

/** Rendered only while items are hidden; `children` says how many come next. */
export function ShowMoreButton({
  hidden,
  onClick,
  children,
}: {
  hidden: number;
  onClick: () => void;
  children: ReactNode;
}) {
  if (hidden <= 0) return null;
  return (
    <Button type="button" variant="secondary" className="self-center" onClick={onClick}>
      {children}
    </Button>
  );
}
