import { cn } from '../lib/utils';

/**
 * A short row of mutually exclusive choices, such as a period (DESIGN.md
 * §4.1). Each choice is a toggle button with `aria-pressed`, so it reads as
 * "pressed" to screen readers and keeps the normal Tab order.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string | undefined;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex gap-1 rounded-md bg-surface-muted p-1', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'min-h-8 rounded-sm px-3 text-caption font-semibold',
            value === option.value ? 'bg-surface shadow-sm' : 'text-text-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
