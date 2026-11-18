import type { ReactNode } from 'react';
import { Badge } from './badge';

export type Tone = 'positive' | 'caution' | 'neutral';

/**
 * Change colored by the objective's direction (README §7.6). The text always
 * carries arrow and value, so color is never the only information.
 */
export function TrendIndicator({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <Badge tone={tone}>{children}</Badge>;
}
