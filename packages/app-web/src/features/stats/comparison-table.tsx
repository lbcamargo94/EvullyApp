import { TableCell, TableRow } from '@evully/ui';
import type { ReactNode } from 'react';
import { comparisonMessages as m } from './messages.pt-BR';

/** A dash for a figure without enough records; named for screen readers. */
export function Missing() {
  return (
    <span className="text-text-muted" aria-label={m.missingLabel}>
      —
    </span>
  );
}

/** One indicator: its name as the row header, then this period and the one before. */
export function Row({
  label,
  current,
  previous,
}: {
  label: string;
  current: ReactNode;
  previous: ReactNode;
}) {
  return (
    <TableRow>
      <th scope="row" className="px-3 py-3 font-normal">
        {label}
      </th>
      <TableCell>{current}</TableCell>
      <TableCell>{previous}</TableCell>
    </TableRow>
  );
}
