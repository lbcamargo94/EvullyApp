import { useCreateProfile, useCurrentProfile, useProfiles } from '@evully/app-core';
import { Card } from '@evully/ui';
import { useNavigate } from 'react-router';
import { Logo } from '../shell/logo';
import { ImportProfileButton } from './import-profile-button';
import { profileMessages as m, transferMessages } from './messages.pt-BR';
import { ProfileForm, emptyProfile } from './profile-form';

export function ProfileCreateScreen() {
  const create = useCreateProfile();
  const { data: profiles } = useProfiles();
  const { select } = useCurrentProfile();
  const navigate = useNavigate();
  const hasProfiles = (profiles?.length ?? 0) > 0;

  return (
    <main className="flex min-h-screen justify-center bg-background px-4 py-10 text-text">
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <Logo />
        <Card className="gap-6 p-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">{m.createTitle}</h1>
            <p className="text-text-muted">{m.createSubtitle}</p>
          </div>
          <ProfileForm
            defaultValues={emptyProfile}
            submitLabel={m.create}
            onSubmit={async (values) => {
              const profile = await create.mutateAsync(values);
              select(profile.id);
              await navigate('/onboarding', { replace: true });
            }}
            {...(hasProfiles && { onCancel: () => void navigate('/profiles') })}
          />
        </Card>
        {!hasProfiles && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span>{transferMessages.otherComputer}</span>
            <ImportProfileButton
              variant="ghost"
              onImported={() => void navigate('/profiles', { replace: true })}
            />
          </div>
        )}
      </div>
    </main>
  );
}
