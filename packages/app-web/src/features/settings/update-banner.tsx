import { useUpdateStatus } from '@evully/app-core';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Alert, Button } from '@evully/ui';
import { updateMessages as m } from './messages.pt-BR';
import { InstallButton } from './update-section';

/** Shown on every screen once a verified update is ready; installs only on click. */
export function UpdateBanner() {
  const { data: status } = useUpdateStatus();
  const [hidden, setHidden] = useState<string | null>(null);
  if (status?.state !== 'ready' || hidden === status.availableVersion) return null;

  return (
    <Alert
      tone="info"
      icon={Sparkles}
      title={m.bannerTitle(status.availableVersion ?? '')}
      actions={
        <>
          <InstallButton />
          <Button type="button" variant="ghost" onClick={() => setHidden(status.availableVersion)}>
            {m.later}
          </Button>
        </>
      }
    >
      {m.bannerBody}
    </Alert>
  );
}
