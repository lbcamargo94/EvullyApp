import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '../lib/utils';

export const Tabs = TabsPrimitive.Root;

/**
 * After a mouse click on a tab, Radix leaves the list itself as an extra,
 * invisible Tab stop; focusing the list now hands focus to the active tab.
 */
export function TabsList({
  className,
  onFocus,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      onFocus={(event) => {
        onFocus?.(event);
        if (event.target === event.currentTarget) {
          event.currentTarget
            .querySelector<HTMLElement>('[role="tab"][data-state="active"]')
            ?.focus();
        }
      }}
      className={cn(
        'flex flex-wrap gap-1 self-start rounded-md bg-surface-muted p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'min-h-10 rounded-sm px-3.5 text-body font-semibold text-text-muted focus-visible:outline-2 focus-visible:outline-brand data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      // The panel is a Tab stop (Radix): its ring shows where keyboard focus is.
      className={cn(
        'flex flex-col gap-6 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand',
        className,
      )}
      {...props}
    />
  );
}
