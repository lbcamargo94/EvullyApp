import { useUpdateStatus } from '@evully/app-core';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@evully/ui';
import { updateMessages as m } from './messages.pt-BR';
import { InstallButton } from './update-section';

/** Shown on every screen once a verified update is ready; installs only on click. */
export function UpdateBanner() {
  const { data: status } = useUpdateStatus();
  const [hidden, setHidden] = useState<string | null>(null);
  if (status?.state !== 'ready' || hidden === status.availableVersion) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-md border border-brand/40 bg-brand-soft px-4 py-3 text-text"
    >
      <Sparkles aria-hidden="true" className="size-5 text-brand" />
      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="font-semibold">{m.bannerTitle(status.availableVersion ?? '')}</strong>
        <span className="text-sm">{m.bannerBody}</span>
      </div>
      <InstallButton />
      <Button type="button" variant="ghost" onClick={() => setHidden(status.availableVersion)}>
        {m.later}
      </Button>
    </div>
  );
}
