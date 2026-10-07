import { profileInitial, useCurrentProfile, useProfiles } from '@evully/app-core';
import { Avatar } from '@evully/ui';
import { Lock, Plus } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router';
import { Logo } from '../shell/logo';
import { profileMessages as m } from './messages.pt-BR';

const tile =
  'flex w-44 flex-col items-center gap-3.5 rounded-lg px-4 pt-7 pb-5 text-[17px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

/** "Quem está usando?" — names and avatars only, never personal data (README §8.1). */
export function ProfileSelectScreen() {
  const { data: profiles, isPending, isError } = useProfiles();
  const { select } = useCurrentProfile();
  const navigate = useNavigate();

  if (profiles?.length === 0) return <Navigate to="/profiles/new" replace />;

  const open = (id: string) => {
    select(id);
    void navigate('/app');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background px-6 py-12 text-text">
      <Logo size="lg" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[32px] font-semibold tracking-tight">{m.selectTitle}</h1>
        <p className="text-text-muted">{isError ? m.loadError : m.selectSubtitle}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6" aria-busy={isPending}>
        {profiles?.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => open(profile.id)}
            className={`${tile} border border-border bg-surface font-semibold hover:border-brand`}
          >
            <Avatar initial={profileInitial(profile.name)} size="lg" />
            {profile.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void navigate('/profiles/new')}
          className={`${tile} border border-dashed border-text-muted/40 font-medium text-text-muted hover:border-brand hover:text-text`}
        >
          <span className="inline-flex size-22 items-center justify-center rounded-full border border-dashed border-text-muted/40">
            <Plus aria-hidden="true" className="size-8" />
          </span>
          {m.addProfile}
        </button>
      </div>

      <p className="flex items-center gap-2 text-sm text-text-muted">
        <Lock aria-hidden="true" className="size-4" />
        {m.localDataNote}
      </p>
    </main>
  );
}
