import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface CurrentProfile {
  /** Profile in use, or null on the selection screen. Kept in memory only. */
  profileId: string | null;
  select(id: string): void;
  clear(): void;
}

const CurrentProfileContext = createContext<CurrentProfile | null>(null);

export function CurrentProfileProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const value = useMemo<CurrentProfile>(
    () => ({ profileId, select: setProfileId, clear: () => setProfileId(null) }),
    [profileId],
  );
  return <CurrentProfileContext.Provider value={value}>{children}</CurrentProfileContext.Provider>;
}

export function useCurrentProfile(): CurrentProfile {
  const value = useContext(CurrentProfileContext);
  if (!value) throw new Error('useCurrentProfile must be used inside CurrentProfileProvider');
  return value;
}
