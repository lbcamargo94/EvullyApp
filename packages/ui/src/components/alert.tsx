import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Icon } from './icon';

export type AlertTone = 'info' | 'success' | 'caution' | 'danger';

const tones: Record<AlertTone, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: 'border-brand/40 bg-brand-soft', icon: 'text-brand', Icon: Info },
  success: { box: 'border-positive/40 bg-positive-soft', icon: 'text-positive', Icon: CircleCheck },
  caution: { box: 'border-caution/40 bg-caution-soft', icon: 'text-caution', Icon: TriangleAlert },
  danger: { box: 'border-danger/40 bg-danger-soft', icon: 'text-danger', Icon: CircleAlert },
};

/**
 * Notice in the page flow (no toasts, DESIGN.md §6): icon, title, body and
 * actions. Problems that need attention use role="alert"; the rest "status".
 */
export function Alert({
  tone = 'info',
  title,
  children,
  actions,
  icon,
  className,
}: {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  const t = tones[tone];
  const glyph = icon ?? t.Icon;
  return (
    <div
      role={tone === 'danger' || tone === 'caution' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border px-4 py-3 text-text',
        t.box,
        className,
      )}
    >
      <Icon icon={glyph} size="md" className={t.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="font-semibold">{title}</strong>
        {children && <span className="text-body">{children}</span>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
