import { errorCode, useCreateTag } from '@evully/app-core';
import type { Tag } from '@evully/contracts';
import { Button, Input } from '@evully/ui';
import { Plus } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { weightErrorByCode, weightMessages as m } from './messages.pt-BR';

/** Creates a tag inline; the new tag is handed back so the form can select it. */
export function NewTagButton({
  profileId,
  onCreated,
}: {
  profileId: string;
  onCreated: (tag: Tag) => void;
}) {
  const create = useCreateTag(profileId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setName('');
    setError(null);
  };

  const save = async () => {
    try {
      onCreated(await create.mutateAsync(name));
      close();
    } catch (e) {
      setError(weightErrorByCode[errorCode(e) ?? ''] ?? m.genericError);
    }
  };

  // Enter saves without submitting the weighing form; Escape cancels.
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-text-muted/50 px-3.5 text-sm text-text-muted hover:border-brand hover:text-text"
      >
        <Plus aria-hidden="true" className="size-4" />
        {m.newTag}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          aria-label={m.newTagName}
          aria-invalid={!!error}
          aria-describedby={error ? 'new-tag-error' : undefined}
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-h-9 max-w-56 flex-1"
        />
        <Button
          type="button"
          className="min-h-9"
          disabled={create.isPending}
          onClick={() => void save()}
        >
          {m.addTag}
        </Button>
        <Button type="button" variant="ghost" className="min-h-9" onClick={close}>
          {m.cancelTag}
        </Button>
      </div>
      {error && (
        <p id="new-tag-error" role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
