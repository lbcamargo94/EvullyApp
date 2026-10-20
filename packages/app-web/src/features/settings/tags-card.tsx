import { useRemoveTag, useRenameTag, useTags } from '@evully/app-core';
import type { Tag } from '@evully/contracts';
import { Button, Card, ConfirmDialog, Input } from '@evully/ui';
import { Pencil, Trash2 } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { weightErrorByCode } from '../weights/messages.pt-BR';
import { NewTagButton } from '../weights/new-tag-button';
import { settingsMessages, trackingSettingsMessages as m } from './messages.pt-BR';
import { settingsError } from './settings-feedback';

/** Rename, remove (soft delete) and add context tags (README §6.4). */
export function TagsCard({ profileId }: { profileId: string }) {
  const { data: tags } = useTags(profileId);
  const remove = useRemoveTag(profileId);
  const [pending, setPending] = useState<Tag | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmRemove = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync(pending.id);
      setError(null);
    } catch (e) {
      setError(settingsError(e));
    }
    setPending(null);
  };

  return (
    <Card aria-labelledby="tags-title">
      <div className="flex flex-col gap-1">
        <h2 id="tags-title" className="text-lg font-semibold">
          {m.tagsTitle}
        </h2>
        <p className="text-sm text-text-muted">{m.tagsHint}</p>
      </div>
      <ul className="flex flex-col">
        {tags?.length === 0 && <li className="text-sm text-text-muted">{m.noTags}</li>}
        {tags?.map((tag) => (
          <TagRow key={tag.id} profileId={profileId} tag={tag} onRemove={setPending} />
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <NewTagButton profileId={profileId} onCreated={() => setError(null)} />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={m.removeTagTitle}
        description={m.removeTagBody(pending?.name ?? '')}
        confirmLabel={m.removeTagConfirm}
        cancelLabel={settingsMessages.cancel}
        destructive
        busy={remove.isPending}
        onConfirm={() => void confirmRemove()}
      />
    </Card>
  );
}

function TagRow({
  profileId,
  tag,
  onRemove,
}: {
  profileId: string;
  tag: Tag;
  onRemove: (tag: Tag) => void;
}) {
  const rename = useRenameTag(profileId);
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorId = `tag-error-${tag.id}`;

  const cancel = () => {
    setName(null);
    setError(null);
  };
  const save = async () => {
    try {
      await rename.mutateAsync({ id: tag.id, name: name ?? tag.name });
      cancel();
    } catch (e) {
      setError(settingsError(e, weightErrorByCode));
    }
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void save();
    else if (e.key === 'Escape') cancel();
  };

  if (name === null) {
    return (
      <li className="flex items-center gap-2 border-t border-border py-1.5">
        <span className="flex-1">{tag.name}</span>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-2"
          aria-label={m.rename(tag.name)}
          onClick={() => setName(tag.name)}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-2"
          aria-label={m.remove(tag.name)}
          onClick={() => onRemove(tag)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1.5 border-t border-border py-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          aria-label={m.tagName}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-h-9 max-w-56 flex-1"
        />
        <Button
          type="button"
          className="min-h-9"
          disabled={rename.isPending}
          onClick={() => void save()}
        >
          {m.save}
        </Button>
        <Button type="button" variant="ghost" className="min-h-9" onClick={cancel}>
          {settingsMessages.cancel}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
