import {
  useAppInfo,
  useAppSettings,
  useCurrentProfile,
  useProfile,
  useTrackingState,
} from '@evully/app-core';
import {
  Activity,
  Apple,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Ruler,
  Scale,
  Settings,
} from 'lucide-react';
import { useCallback } from 'react';
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router';
import { BackupErrorBanner } from '../settings/backup-error-banner';
import { Logo } from './logo';
import { shellMessages as m } from './messages.pt-BR';
import { ProfileSwitcher } from './profile-switcher';
import { useInactivity } from './use-inactivity';

const navItem =
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium text-text-muted hover:bg-surface-muted aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold aria-[current=page]:text-brand-soft-foreground';

/** Layout for screens that belong to a profile. Without one, goes back to selection. */
export function AppShell() {
  const { profileId, clear } = useCurrentProfile();
  const { data: profile, isError } = useProfile(profileId);
  const { data: settings } = useAppSettings();
  const { data: info } = useAppInfo();
  const { data: tracking } = useTrackingState(profileId);
  const navigate = useNavigate();

  const lock = useCallback(() => {
    clear();
    void navigate('/profiles', { replace: true });
  }, [clear, navigate]);
  useInactivity(settings?.inactivityLockMinutes ?? 0, lock);

  if (!profileId || isError) return <Navigate to="/profiles" replace />;
  // Profiles that never answered (or skipped) the questionnaire go through it first.
  if (tracking && tracking.questionnaire === null) return <Navigate to="/onboarding" replace />;

  return (
    <div className="flex min-h-screen flex-wrap bg-background text-text">
      <nav
        aria-label={m.mainMenu}
        className="flex flex-[1_1_220px] flex-col gap-7 border-r border-border bg-surface px-4 py-6"
      >
        <div className="px-2">
          <Logo />
        </div>
        <div className="flex flex-col gap-1">
          <NavLink to="/app" end className={navItem}>
            <LayoutDashboard aria-hidden="true" className="size-5" />
            {m.dashboard}
          </NavLink>
          <NavLink to="/app/weight" className={navItem}>
            <Scale aria-hidden="true" className="size-5" />
            {m.weight}
          </NavLink>
          <NavLink to="/app/measurements" className={navItem}>
            <Ruler aria-hidden="true" className="size-5" />
            {m.measurements}
          </NavLink>
          <NavLink to="/app/diet" className={navItem}>
            <Apple aria-hidden="true" className="size-5" />
            {m.diet}
          </NavLink>
          <NavLink to="/app/workouts" className={navItem}>
            <Dumbbell aria-hidden="true" className="size-5" />
            {m.workouts}
          </NavLink>
          <NavLink to="/app/cardio" className={navItem}>
            <Activity aria-hidden="true" className="size-5" />
            {m.cardio}
          </NavLink>
          <NavLink to="/app/habits" className={navItem}>
            <ListChecks aria-hidden="true" className="size-5" />
            {m.habits}
          </NavLink>
          <NavLink to="/app/settings" className={navItem}>
            <Settings aria-hidden="true" className="size-5" />
            {m.settings}
          </NavLink>
        </div>
        {info && <p className="mt-auto px-3 text-xs text-text-muted">{m.version(info.version)}</p>}
      </nav>
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6 px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          {profile && <ProfileSwitcher currentName={profile.name} />}
        </header>
        <BackupErrorBanner />
        <main className="flex flex-col gap-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
