import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useRef, type ReactNode } from 'react';
import { Button } from './button';

export const Dialog = DialogPrimitive.Root;

/**
 * Centered modal panel with overlay; focus is trapped while open and goes
 * back to what had it before opening. Dialogs opened from state (no Radix
 * Trigger) would otherwise drop focus to the page on close.
 */
export function DialogContent({ children }: { children: ReactNode }) {
  const previous = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay" />
      <DialogPrimitive.Content
        onOpenAutoFocus={() => {
          previous.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          const target = previous.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
        className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border bg-surface p-6 text-text shadow-lg"
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return (
    <DialogPrimitive.Title className="text-heading font-semibold">{children}</DialogPrimitive.Title>
  );
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return (
    <DialogPrimitive.Description className="text-body text-text-muted">
      {children}
    </DialogPrimitive.Description>
  );
}

/**
 * Confirmation dialog for destructive or important actions (DESIGN.md §6).
 * Focus is trapped while open and returns to the trigger on close.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="flex justify-end gap-3 pt-2">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="ghost" disabled={busy}>
              {cancelLabel}
            </Button>
          </DialogPrimitive.Close>
          <Button
            type="button"
            variant={destructive ? 'danger' : 'primary'}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
