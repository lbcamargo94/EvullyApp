import type {
  AcceptTrackingInput,
  AppInfo,
  ArchivedProfile,
  AppSettings,
  ApplyMealTemplateInput,
  BackupResult,
  BackupStatus,
  PrepareRestoreInput,
  ExportFormat,
  ExportResult,
  RestorableBackups,
  RestorePreview,
  CardioInput,
  CardioOverview,
  CardioTargetDto,
  CardioTargetInput,
  CardioSessionDto,
  CopyMealInput,
  CreateTagInput,
  ExerciseDto,
  ExerciseHistoryDto,
  ExerciseInput,
  FoodDto,
  HabitDay,
  HabitHistory,
  HabitDto,
  HabitInput,
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
  NutritionHistory,
  PlanTemplateCode,
  PrescriptionDto,
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
  SetValuesDto,
  SaveMealTemplateInput,
  SetMealConsumedInput,
  Tag,
  TrackingState,
  UpdateAppSettingsInput,
  UpdateCardioInput,
  UpdateHabitInput,
  UpdateExerciseInput,
  UpdateFoodInput,
  UpdateMeasurementInput,
  UpdateProfileInput,
  UpdateWeightInput,
  WaterLogInput,
  WorkoutPlanDto,
  WorkoutPreferencesDto,
  WorkoutPreferencesInput,
  WorkoutSessionDto,
  WorkoutStats,
  WeightDisplay,
  WeightEntry,
  WeightInput,
  WeightSummary,
  SleepInput,
  SleepLogDto,
  SleepTargetDto,
  SleepTargetInput,
  UpdateSleepInput,
  UpdateStatus,
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
  updates: {
    status(): Promise<UpdateStatus>;
    check(): Promise<UpdateStatus>;
    install(): Promise<null>;
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
    history(profileId: string): Promise<NutritionHistory>;
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
    history(profileId: string, exerciseId: string): Promise<ExerciseHistoryDto>;
    setIncrement(
      profileId: string,
      exerciseId: string,
      loadIncrementKg: number | null,
    ): Promise<ExerciseHistoryDto>;
  };
  workoutPlans: {
    list(profileId: string): Promise<WorkoutPlanDto[]>;
    create(profileId: string, name: string): Promise<WorkoutPlanDto>;
    update(
      profileId: string,
      id: string,
      values: { name: string; status: 'active' | 'archived' },
    ): Promise<WorkoutPlanDto>;
    importTemplate(profileId: string, template: PlanTemplateCode): Promise<WorkoutPlanDto>;
    addDay(
      profileId: string,
      planId: string,
      day: { name: string; weekday: number | null },
    ): Promise<WorkoutPlanDto>;
    updateDay(
      profileId: string,
      id: string,
      day: { name: string; weekday: number | null },
    ): Promise<WorkoutPlanDto>;
    removeDay(profileId: string, id: string): Promise<WorkoutPlanDto>;
    moveDay(profileId: string, id: string, direction: 'up' | 'down'): Promise<WorkoutPlanDto>;
    addExercise(
      profileId: string,
      dayId: string,
      exerciseId: string,
      prescription: PrescriptionDto,
    ): Promise<WorkoutPlanDto>;
    updateExercise(
      profileId: string,
      id: string,
      prescription: PrescriptionDto,
    ): Promise<WorkoutPlanDto>;
    removeExercise(profileId: string, id: string): Promise<WorkoutPlanDto>;
    moveExercise(profileId: string, id: string, direction: 'up' | 'down'): Promise<WorkoutPlanDto>;
  };
  workoutPreferences: {
    get(profileId: string): Promise<WorkoutPreferencesDto>;
    answer(input: WorkoutPreferencesInput): Promise<WorkoutPreferencesDto>;
    skip(profileId: string): Promise<WorkoutPreferencesDto>;
  };
  workoutSessions: {
    stats(profileId: string): Promise<WorkoutStats>;
    open(profileId: string): Promise<WorkoutSessionDto | null>;
    start(profileId: string, workoutDayId: string | null): Promise<WorkoutSessionDto>;
    finish(profileId: string, id: string, notes: string | null): Promise<null>;
    discard(profileId: string, id: string): Promise<null>;
    updateSet(profileId: string, id: string, values: SetValuesDto): Promise<WorkoutSessionDto>;
    addSet(profileId: string, performanceId: string): Promise<WorkoutSessionDto>;
    removeSet(profileId: string, id: string): Promise<WorkoutSessionDto>;
    addExercise(
      profileId: string,
      sessionId: string,
      exerciseId: string,
    ): Promise<WorkoutSessionDto>;
    replaceExercise(profileId: string, id: string, exerciseId: string): Promise<WorkoutSessionDto>;
    removeExercise(profileId: string, id: string): Promise<WorkoutSessionDto>;
  };
  cardio: {
    overview(profileId: string): Promise<CardioOverview>;
    register(input: CardioInput): Promise<CardioSessionDto>;
    update(input: UpdateCardioInput): Promise<CardioSessionDto>;
    remove(profileId: string, id: string): Promise<null>;
    setTarget(input: CardioTargetInput): Promise<CardioTargetDto | null>;
  };
  habits: {
    list(profileId: string): Promise<HabitDto[]>;
    create(input: HabitInput): Promise<HabitDto>;
    update(input: UpdateHabitInput): Promise<HabitDto>;
    deactivate(profileId: string, id: string): Promise<null>;
    move(profileId: string, id: string, direction: 'up' | 'down'): Promise<HabitDto[]>;
    addExamples(profileId: string): Promise<HabitDto[]>;
    day(profileId: string, date: string): Promise<HabitDay>;
    history(profileId: string, habitId: string): Promise<HabitHistory>;
    log(profileId: string, habitId: string, date: string, value: number | null): Promise<HabitDay>;
  };
  sleep: {
    list(profileId: string): Promise<SleepLogDto[]>;
    register(input: SleepInput): Promise<SleepLogDto>;
    update(input: UpdateSleepInput): Promise<SleepLogDto>;
    remove(profileId: string, id: string): Promise<null>;
    target(profileId: string): Promise<SleepTargetDto | null>;
    setTarget(input: SleepTargetInput): Promise<SleepTargetDto | null>;
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
  /** Export of one profile (README §14.3); absent where files cannot be saved. */
  exports?: {
    create(profileId: string, format: ExportFormat): Promise<ExportResult>;
  };
  /** Absent on platforms without local data (web, mobile). */
  backup?: {
    status(): Promise<BackupStatus>;
    createManual(): Promise<BackupResult | null>;
    setAutomatic(enabled: boolean): Promise<BackupStatus>;
    chooseExtraDirectory(clear: boolean): Promise<BackupStatus>;
    dismissError(): Promise<BackupStatus>;
    restorable(): Promise<RestorableBackups>;
    prepareRestore(input: PrepareRestoreInput): Promise<RestorePreview | null>;
    /** Stages the backup and restarts the app. */
    restore(token: string): Promise<null>;
  };
}

/** Stable error code of a failed client call, if any. */
export function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined;
}
