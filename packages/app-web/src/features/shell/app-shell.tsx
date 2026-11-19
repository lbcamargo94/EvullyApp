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
  ChartLine,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Moon,
  Ruler,
  Scale,
  Settings,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useCatalogAvailable } from '../catalog/catalog-link';
import { BackupErrorBanner } from '../settings/backup-error-banner';
import { isFocusRequest } from '../shared/focus-request';
import { UpdateBanner } from '../settings/update-banner';
import { Logo } from './logo';
import { shellMessages as m } from './messages.pt-BR';
import { ProfileSwitcher } from './profile-switcher';
import { QueryErrorBanner } from './query-error-banner';
import { useInactivity } from './use-inactivity';

// Menu item states (DESIGN.md §5): default, hover, keyboard focus and current page.
const navItem =
  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-body font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none aria-[current=page]:bg-brand-soft aria-[current=page]:font-semibold aria-[current=page]:text-brand-soft-foreground';

/** Layout for screens that belong to a profile. Without one, goes back to selection. */
export function AppShell() {
  const { profileId, clear } = useCurrentProfile();
  const { data: profile, isError } = useProfile(profileId);
  const { data: settings } = useAppSettings();
  const { data: info } = useAppInfo();
  const { data: tracking } = useTrackingState(profileId);
  const navigate = useNavigate();
  const catalog = useCatalogAvailable();
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const shownPath = useRef(location.pathname);
  // A new screen (not a tab change) moves focus to its content, so screen
  // readers announce it; screens opened to type keep the cursor in their field.
  useEffect(() => {
    if (shownPath.current === location.pathname) return;
    shownPath.current = location.pathname;
    if (!isFocusRequest(location.state)) mainRef.current?.focus();
  }, [location]);

  const lock = useCallback(() => {
    clear();
    void navigate('/profiles', { replace: true });
  }, [clear, navigate]);
  useInactivity(settings?.inactivityLockMinutes ?? 0, lock);

  if (!profileId || isError) return <Navigate to="/profiles" replace />;
  // Profiles that never answered (or skipped) the questionnaire go through it first.
  if (tracking && tracking.questionnaire === null) return <Navigate to="/onboarding" replace />;

  return (
    <div className="flex min-h-screen bg-background text-text">
      {/* A button, not `#main-content`: a hash link would change the HashRouter route. */}
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-foreground"
      >
        {m.skipToContent}
      </button>
      <nav
        aria-label={m.mainMenu}
        className="sticky top-0 flex h-screen w-sidebar shrink-0 flex-col gap-7 overflow-y-auto border-r border-border bg-surface px-4 py-6"
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
          <NavLink to="/app/sleep" className={navItem}>
            <Moon aria-hidden="true" className="size-5" />
            {m.sleep}
          </NavLink>
          <NavLink to="/app/stats" className={navItem}>
            <ChartLine aria-hidden="true" className="size-5" />
            {m.stats}
          </NavLink>
          <NavLink to="/app/settings" className={navItem}>
            <Settings aria-hidden="true" className="size-5" />
            {m.settings}
          </NavLink>
        </div>
        <div className="mt-auto flex flex-col gap-1 px-3">
          {catalog && (
            <Link
              to="/dev/catalog"
              className="text-caption text-brand underline-offset-2 hover:underline"
            >
              {m.catalog}
            </Link>
          )}
          {info && <p className="text-caption text-text-muted">{m.version(info.version)}</p>}
        </div>
      </nav>
      <div className="mx-auto flex w-full max-w-content min-w-0 flex-col gap-6 px-8 py-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          {profile && <ProfileSwitcher currentName={profile.name} />}
        </header>
        <UpdateBanner />
        <BackupErrorBanner />
        <QueryErrorBanner />
        <main ref={mainRef} tabIndex={-1} className="flex flex-col gap-6 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
