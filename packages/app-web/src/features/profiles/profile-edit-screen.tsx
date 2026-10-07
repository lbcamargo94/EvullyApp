import { useCurrentProfile, useProfile, useUpdateProfile } from '@evully/app-core';
import { Card } from '@evully/ui';
import { useNavigate } from 'react-router';
import { profileMessages as m } from './messages.pt-BR';
import { ProfileForm } from './profile-form';

export function ProfileEditScreen() {
  const { profileId } = useCurrentProfile();
  const { data: profile } = useProfile(profileId);
  const update = useUpdateProfile();
  const navigate = useNavigate();

  if (!profile) return null;
  const { id, name, birthDate, sex, heightCm } = profile;

  return (
    <Card className="max-w-2xl gap-6">
      <h1 className="text-2xl font-semibold">{m.editTitle}</h1>
      <ProfileForm
        defaultValues={{ name, birthDate, sex, heightCm }}
        submitLabel={m.save}
        onSubmit={async (values) => {
          await update.mutateAsync({ id, ...values });
          await navigate('/app');
        }}
        onCancel={() => void navigate('/app')}
      />
    </Card>
  );
}
