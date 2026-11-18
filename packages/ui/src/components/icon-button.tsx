import type { ReactNode } from 'react';
import { Button } from './button';
import { Tooltip } from './tooltip';

/**
 * Small ghost button with only an icon. `label` is its accessible name and
 * also shows as a tooltip on hover and keyboard focus.
 */
export function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean | undefined;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip content={label}>
      <Button
        type="button"
        variant="ghost"
        className="min-h-9 min-w-9 px-2"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
