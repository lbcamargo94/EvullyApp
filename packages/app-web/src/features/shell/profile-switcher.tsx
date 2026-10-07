import { profileInitial, useCurrentProfile, useProfiles } from '@evully/app-core';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@evully/ui';
import { ChevronDown, Pencil, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { shellMessages as m } from './messages.pt-BR';

/** "Perfil atual: Lucas ▼" (README §8.4). Switching never mixes records. */
export function ProfileSwitcher({ currentName }: { currentName: string }) {
  const { profileId, select } = useCurrentProfile();
  const { data: profiles = [] } = useProfiles();
  const navigate = useNavigate();
  const others = profiles.filter((p) => p.id !== profileId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m.switchProfile(currentName)}
        className="flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-surface py-1.5 pr-3 pl-1.5 text-[15px] font-medium hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Avatar initial={profileInitial(currentName)} />
        {currentName}
        <ChevronDown aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {others.length > 0 && (
          <>
            <DropdownMenuLabel>{m.otherProfiles}</DropdownMenuLabel>
            {others.map((p) => (
              <DropdownMenuItem key={p.id} onSelect={() => select(p.id)}>
                <Avatar initial={profileInitial(p.name)} />
                {p.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => void navigate('/app/profile')}>
          <Pencil aria-hidden="true" className="size-4" />
          {m.editProfile}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void navigate('/profiles')}>
          <Users aria-hidden="true" className="size-4" />
          {m.allProfiles}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
