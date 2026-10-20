import { confirmsProfileName, useDeleteProfilePermanently } from '@evully/app-core';
import type { ArchivedProfile } from '@evully/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@evully/ui';
import { useState, type FormEvent } from 'react';
import { profileSettingsMessages as m, settingsMessages } from './messages.pt-BR';
import { settingsError } from './settings-feedback';

/**
 * Permanent deletion (README §8.3.1): the user types the profile name; the main
 * process writes a backup before deleting anything.
 */
export function DeleteProfileDialog({
  profile,
  onClose,
  onDeleted,
}: {
  profile: ArchivedProfile;
  onClose: () => void;
  onDeleted: (name: string) => void;
}) {
  const remove = useDeleteProfilePermanently();
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const matches = confirmsProfileName(typed, profile.name);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!matches) return;
    setError(null);
    try {
      await remove.mutateAsync({ id: profile.id, confirmName: typed });
      onDeleted(profile.name);
    } catch (err) {
      setError(settingsError(err));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !remove.isPending && onClose()}>
      <DialogContent>
        <DialogTitle>{m.deleteTitle}</DialogTitle>
        <DialogDescription>{m.deleteBody(profile.name)}</DialogDescription>
        <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <Field
            id="delete-profile-name"
            label={m.deleteTypeName(profile.name)}
            error={error ?? undefined}
          >
            <Input
              id="delete-profile-name"
              autoComplete="off"
              autoFocus
              value={typed}
              aria-invalid={!!error}
              onChange={(e) => setTyped(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="ghost" disabled={remove.isPending} onClick={onClose}>
              {settingsMessages.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={!matches || remove.isPending}>
              {remove.isPending ? m.deleting : m.deleteConfirm}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
