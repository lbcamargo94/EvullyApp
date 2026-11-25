import { useEvullyClient } from '@evully/app-core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * A clicked reminder brings the window back (README §25): when it belongs to
 * the open profile, its screen opens. Another profile's reminder only shows
 * the window; profiles are never switched without the user.
 */
export function useReminderOpen(profileId: string | null) {
  const client = useEvullyClient();
  const navigate = useNavigate();
  useEffect(() => {
    if (!profileId) return;
    const take = () =>
      void client.reminders
        .takeOpen()
        .then((open) => {
          if (open && open.profileId === profileId) void navigate(open.route);
        })
        .catch(() => undefined);
    take();
    window.addEventListener('focus', take);
    return () => window.removeEventListener('focus', take);
  }, [client, navigate, profileId]);
}
