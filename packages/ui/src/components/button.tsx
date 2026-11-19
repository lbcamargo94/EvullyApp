import { Icon } from './icon';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-body font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:opacity-90',
        secondary: 'border border-border bg-surface text-text hover:bg-surface-muted',
        ghost: 'text-text-muted hover:bg-surface-muted hover:text-text',
        danger: 'border border-danger text-danger hover:bg-danger-soft',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Work in progress: disables the button and shows a spinner before the label. */
    busy?: boolean;
  };

export function Button({
  className,
  variant,
  asChild = false,
  busy = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant }), className);
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <button
      className={classes}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy && <Icon icon={LoaderCircle} className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
}
