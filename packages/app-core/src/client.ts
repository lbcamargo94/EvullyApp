import type {
  AcceptTrackingInput,
  AppInfo,
  ArchivedProfile,
  AppSettings,
  ApplyMealTemplateInput,
  BackupResult,
  BackupStatus,
  CopyMealInput,
  CreateTagInput,
  ExerciseDto,
  ExerciseInput,
  FoodDto,
  FoodInput,
  FoodLogInput,
  DeleteProfileInput,
  ImportKind,
  ImportPreview,
  ImportResult,
  LegalDocuments,
  MeasurementInput,
  MeasurementSession,
  MeasurementSummary,
  MealTemplateDto,
  MeasurementTypeDto,
  NutritionDay,
  NutritionPreferencesDto,
  NutritionPreferencesInput,
  NutritionTargetDto,
  NutritionTargetInput,
  ProfileDto,
  ProfileInput,
  ProfileSummary,
  ProjectCreateInput,
  ProjectDto,
  ProjectUpdateInput,
  RenameTagInput,
  SaveMealTemplateInput,
  SetMealConsumedInput,
  Tag,
  TrackingState,
  UpdateAppSettingsInput,
  UpdateExerciseInput,
  UpdateFoodInput,
  UpdateMeasurementInput,
  UpdateProfileInput,
  UpdateWeightInput,
  WaterLogInput,
  WeightDisplay,
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
    legal(): Promise<LegalDocuments>;
  };
  profiles: {
    list(): Promise<ProfileSummary[]>;
    get(id: string): Promise<ProfileDto>;
    create(input: ProfileInput): Promise<ProfileDto>;
    update(input: UpdateProfileInput): Promise<ProfileDto>;
    listArchived(): Promise<ArchivedProfile[]>;
    archive(id: string): Promise<null>;
    restore(id: string): Promise<ProfileSummary>;
    deletePermanently(input: DeleteProfileInput): Promise<null>;
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
    catalog(): Promise<MeasurementTypeDto[]>;
    setWeightDisplay(profileId: string, weightDisplay: WeightDisplay): Promise<TrackingState>;
    setMeasurements(profileId: string, measurementTypeIds: string[]): Promise<TrackingState>;
  };
  projects: {
    getActive(profileId: string): Promise<ProjectDto | null>;
    list(profileId: string): Promise<ProjectDto[]>;
    create(input: ProjectCreateInput): Promise<ProjectDto>;
    update(input: ProjectUpdateInput): Promise<ProjectDto>;
    complete(profileId: string, id: string): Promise<ProjectDto>;
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
    rename(input: RenameTagInput): Promise<Tag>;
    remove(profileId: string, id: string): Promise<null>;
  };
  /** CSV import; absent on platforms without local files. */
  foods: {
    list(): Promise<FoodDto[]>;
    create(input: FoodInput): Promise<FoodDto>;
    update(input: UpdateFoodInput): Promise<FoodDto>;
    remove(id: string): Promise<null>;
  };
  nutrition: {
    day(profileId: string, date: string): Promise<NutritionDay>;
    add(input: FoodLogInput): Promise<NutritionDay>;
    updateQuantity(profileId: string, id: string, quantity: number): Promise<NutritionDay>;
    setConsumed(profileId: string, id: string, consumed: boolean): Promise<NutritionDay>;
    setMealConsumed(input: SetMealConsumedInput): Promise<NutritionDay>;
    remove(profileId: string, id: string): Promise<NutritionDay>;
    copyMeal(input: CopyMealInput): Promise<NutritionDay>;
  };
  nutritionPreferences: {
    get(profileId: string): Promise<NutritionPreferencesDto>;
    answer(input: NutritionPreferencesInput): Promise<NutritionPreferencesDto>;
    skip(profileId: string): Promise<NutritionPreferencesDto>;
  };
  nutritionTargets: {
    current(profileId: string): Promise<NutritionTargetDto | null>;
    set(input: NutritionTargetInput): Promise<NutritionTargetDto>;
  };
  water: {
    add(input: WaterLogInput): Promise<NutritionDay>;
    remove(profileId: string, id: string): Promise<NutritionDay>;
  };
  exercises: {
    list(profileId: string): Promise<ExerciseDto[]>;
    create(input: ExerciseInput): Promise<ExerciseDto>;
    update(input: UpdateExerciseInput): Promise<ExerciseDto>;
    deactivate(profileId: string, id: string): Promise<null>;
  };
  mealTemplates: {
    list(profileId: string): Promise<MealTemplateDto[]>;
    save(input: SaveMealTemplateInput): Promise<MealTemplateDto>;
    apply(input: ApplyMealTemplateInput): Promise<NutritionDay>;
    remove(profileId: string, id: string): Promise<null>;
  };
  imports?: {
    preview(profileId: string, kind: ImportKind): Promise<ImportPreview | null>;
    confirm(profileId: string, token: string): Promise<ImportResult>;
    cancel(profileId: string, token: string): Promise<null>;
    saveTemplate(profileId: string, kind: ImportKind): Promise<boolean>;
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
