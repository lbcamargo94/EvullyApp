import {
  useArchiveProfile,
  useArchivedProfiles,
  useCurrentProfile,
  useProfile,
  useRestoreProfile,
} from '@evully/app-core';
import type { ArchivedProfile } from '@evully/contracts';
import { Button, Card, ConfirmDialog } from '@evully/ui';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { DeleteProfileDialog } from './delete-profile-dialog';
import { profileSettingsMessages as m, settingsMessages } from './messages.pt-BR';
import { settingsError } from './settings-feedback';

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Settings › Perfil: archive this profile; restore or permanently delete archived ones (README §8.3.1). */
export function ProfileSection({ profileId }: { profileId: string }) {
  return (
    <>
      <CurrentProfileCard profileId={profileId} />
      <ArchivedProfilesCard />
    </>
  );
}

function CurrentProfileCard({ profileId }: { profileId: string }) {
  const { data: profile } = useProfile(profileId);
  const { clear } = useCurrentProfile();
  const navigate = useNavigate();
  const archive = useArchiveProfile();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  const confirm = async () => {
    try {
      await archive.mutateAsync(profile.id);
      clear();
      void navigate('/profiles', { replace: true });
    } catch (e) {
      setError(settingsError(e));
      setConfirming(false);
    }
  };

  return (
    <Card aria-labelledby="current-profile-title">
      <div className="flex flex-col gap-1">
        <h2 id="current-profile-title" className="text-lg font-semibold">
          {m.currentTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.currentHint(profile.name)}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/app/profile">{m.editData}</Link>
        </Button>
        <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
          {m.archive}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={m.archiveTitle}
        description={m.archiveBody(profile.name)}
        confirmLabel={m.archive}
        cancelLabel={settingsMessages.cancel}
        busy={archive.isPending}
        onConfirm={() => void confirm()}
      />
    </Card>
  );
}

function ArchivedProfilesCard() {
  const { data: archived } = useArchivedProfiles();
  const restore = useRestoreProfile();
  const [deleting, setDeleting] = useState<ArchivedProfile | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const restoreProfile = async (profile: ArchivedProfile) => {
    try {
      await restore.mutateAsync(profile.id);
      setFeedback({ ok: true, text: m.restored(profile.name) });
    } catch (e) {
      setFeedback({ ok: false, text: settingsError(e) });
    }
  };

  return (
    <Card aria-labelledby="archived-title">
      <h2 id="archived-title" className="text-lg font-semibold">
        {m.archivedTitle}
      </h2>
      {archived?.length === 0 && <p className="text-sm text-text-muted">{m.noArchived}</p>}
      <ul className="flex flex-col">
        {archived?.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3"
          >
            <div className="flex flex-col gap-0.5">
              <strong className="font-semibold">{p.name}</strong>
              <span className="text-sm text-text-muted">
                {m.archivedOn(dateFormat.format(new Date(p.archivedAt)))}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                aria-label={m.restore(p.name)}
                disabled={restore.isPending}
                onClick={() => void restoreProfile(p)}
              >
                {m.restoreLabel}
              </Button>
              <Button
                type="button"
                variant="danger"
                aria-label={m.delete(p.name)}
                onClick={() => setDeleting(p)}
              >
                {m.deleteLabel}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {feedback && (
        <p
          role={feedback.ok ? 'status' : 'alert'}
          className={feedback.ok ? 'text-sm text-text-muted' : 'text-sm text-danger'}
        >
          {feedback.text}
        </p>
      )}
      {deleting && (
        <DeleteProfileDialog
          profile={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(name) => {
            setDeleting(null);
            setFeedback({ ok: true, text: m.deleted(name) });
          }}
        />
      )}
    </Card>
  );
}
