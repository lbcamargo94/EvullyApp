import {
  CurrentProfileProvider,
  EvullyClientProvider,
  useAppSettings,
  type EvullyClient,
} from '@evully/app-core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { ProfileCreateScreen } from './features/profiles/profile-create-screen';
import { ProfileEditScreen } from './features/profiles/profile-edit-screen';
import { ProfileSelectScreen } from './features/profiles/profile-select-screen';
import { AppShell } from './features/shell/app-shell';
import { HealthNoticeScreen } from './features/shell/health-notice-screen';
import { HomeScreen } from './features/shell/home-screen';
import { ImportScreen } from './features/imports/import-screen';
import { QuestionnaireScreen } from './features/tracking/questionnaire-screen';

// Screens with charts or many forms load on demand to keep the initial bundle small
// (FRONTEND.md §7).
const WeightScreen = lazy(() =>
  import('./features/weights/weight-screen').then((m) => ({ default: m.WeightScreen })),
);
const SettingsScreen = lazy(() =>
  import('./features/settings/settings-screen').then((m) => ({ default: m.SettingsScreen })),
);
const MeasurementScreen = lazy(() =>
  import('./features/measurements/measurement-screen').then((m) => ({
    default: m.MeasurementScreen,
  })),
);

/**
 * Root of the shared screens. Each platform passes its data client and router
 * (HashRouter on Electron, BrowserRouter on the web) — FRONTEND.md §3.4.
 */
export function App({
  client,
  Router,
}: {
  client: EvullyClient;
  Router: ComponentType<{ children: ReactNode }>;
}) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <EvullyClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <CurrentProfileProvider>
          <Router>
            <HealthNoticeGate>
              <AppRoutes />
            </HealthNoticeGate>
          </Router>
        </CurrentProfileProvider>
      </QueryClientProvider>
    </EvullyClientProvider>
  );
}

function HealthNoticeGate({ children }: { children: ReactNode }) {
  const { data: settings } = useAppSettings();
  if (!settings) return null;
  return settings.healthNoticeAcceptedAt ? children : <HealthNoticeScreen />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/profiles" element={<ProfileSelectScreen />} />
      <Route path="/profiles/new" element={<ProfileCreateScreen />} />
      <Route path="/onboarding" element={<QuestionnaireScreen />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route
          path="weight"
          element={
            <Suspense fallback={null}>
              <WeightScreen />
            </Suspense>
          }
        />
        <Route
          path="measurements"
          element={
            <Suspense fallback={null}>
              <MeasurementScreen />
            </Suspense>
          }
        />
        <Route path="import/:kind" element={<ImportScreen />} />
        <Route
          path="settings"
          element={
            <Suspense fallback={null}>
              <SettingsScreen />
            </Suspense>
          }
        />
        <Route path="profile" element={<ProfileEditScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/profiles" replace />} />
    </Routes>
  );
}
