import type {
  AcceptTrackingInput,
  AppInfo,
  AppSettings,
  BackupResult,
  BackupStatus,
  CreateTagInput,
  MeasurementInput,
  MeasurementSession,
  MeasurementSummary,
  ProfileDto,
  ProfileInput,
  ProfileSummary,
  ProjectDto,
  Tag,
  TrackingState,
  UpdateAppSettingsInput,
  UpdateMeasurementInput,
  UpdateProfileInput,
  UpdateWeightInput,
  WeightEntry,
  WeightInput,
  WeightSummary,
} from '@evully/contracts';

/**
 * Data port for the screens (FRONTEND.md §3.2). Each platform provides an
 * implementation: IPC on desktop, HTTP on web, local SQLite + sync on mobile.
 * Failures reject with an error carrying a stable `code`.
 */
export interface EvullyClient {
  app: {
    info(): Promise<AppInfo>;
  };
  profiles: {
    list(): Promise<ProfileSummary[]>;
    get(id: string): Promise<ProfileDto>;
    create(input: ProfileInput): Promise<ProfileDto>;
    update(input: UpdateProfileInput): Promise<ProfileDto>;
  };
  settings: {
    get(): Promise<AppSettings>;
    update(input: UpdateAppSettingsInput): Promise<AppSettings>;
    acceptHealthNotice(): Promise<AppSettings>;
  };
  tracking: {
    getState(profileId: string): Promise<TrackingState>;
    accept(input: AcceptTrackingInput): Promise<TrackingState>;
    skip(profileId: string): Promise<TrackingState>;
  };
  projects: {
    getActive(profileId: string): Promise<ProjectDto | null>;
  };
  weights: {
    list(profileId: string): Promise<WeightEntry[]>;
    summary(profileId: string): Promise<WeightSummary>;
    register(input: WeightInput): Promise<WeightEntry>;
    update(input: UpdateWeightInput): Promise<WeightEntry>;
    remove(profileId: string, id: string): Promise<null>;
  };
  measurements: {
    list(profileId: string): Promise<MeasurementSession[]>;
    summary(profileId: string): Promise<MeasurementSummary>;
    register(input: MeasurementInput): Promise<MeasurementSession>;
    update(input: UpdateMeasurementInput): Promise<MeasurementSession>;
    remove(profileId: string, id: string): Promise<null>;
  };
  tags: {
    list(profileId: string): Promise<Tag[]>;
    create(input: CreateTagInput): Promise<Tag>;
  };
  /** Absent on platforms without local data (web, mobile). */
  backup?: {
    status(): Promise<BackupStatus>;
    createManual(): Promise<BackupResult | null>;
    setAutomatic(enabled: boolean): Promise<BackupStatus>;
    chooseExtraDirectory(clear: boolean): Promise<BackupStatus>;
    dismissError(): Promise<BackupStatus>;
  };
}

/** Stable error code of a failed client call, if any. */
export function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}
