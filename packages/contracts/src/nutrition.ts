import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const foodUnitSchema = z.enum(['g', 'ml', 'portion']);

const grams = z.number().min(0);

/** Shape checks only; ranges and consistency live in packages/domain (README §9.2). */
export const foodInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(80, 'Use até 80 caracteres'),
  brand: z.string().trim().max(60, 'Use até 60 caracteres').nullable(),
  referenceAmount: z.number().positive('Informe a quantidade'),
  referenceUnit: foodUnitSchema,
  caloriesKcal: z.number().min(0),
  proteinG: grams,
  carbohydrateG: grams,
  fatG: grams,
  fiberG: grams.nullable(),
  sodiumMg: z.number().min(0).nullable(),
  source: z.string().trim().max(120, 'Use até 120 caracteres').nullable(),
});

export const updateFoodInputSchema = foodInputSchema.extend({ id: z.uuid() });
export const foodIdInputSchema = z.object({ id: z.uuid() });

/** Foods are a household catalog shared by all profiles (README §6.1). */
export const foodSchema = foodInputSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ------------------------------------------------------------ food logs (README §9.3–9.5)

export const mealTypeSchema = z.enum([
  'breakfast',
  'morning_snack',
  'lunch',
  'pre_workout',
  'dinner',
  'supper',
  'custom',
]);

const mealRef = {
  mealType: mealTypeSchema,
  /** Only for `custom` meals. */
  mealName: z.string().trim().max(40, 'Use até 40 caracteres').nullable(),
};

export const nutritionDayInputSchema = z.object({ profileId: z.uuid(), date: localDate });

export const foodLogInputSchema = z.object({
  profileId: z.uuid(),
  logDate: localDate,
  ...mealRef,
  foodId: z.uuid(),
  quantity: z.number().positive('Informe a quantidade'),
});

export const foodLogIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

export const updateFoodLogQuantityInputSchema = foodLogIdInputSchema.extend({
  quantity: z.number().positive('Informe a quantidade'),
});

export const setFoodLogConsumedInputSchema = foodLogIdInputSchema.extend({
  consumed: z.boolean(),
});

export const setMealConsumedInputSchema = nutritionDayInputSchema.extend({
  ...mealRef,
  consumed: z.boolean(),
});

const nutrientsSchema = z.object({
  caloriesKcal: z.number(),
  proteinG: z.number(),
  carbohydrateG: z.number(),
  fatG: z.number(),
  fiberG: z.number().nullable(),
  sodiumMg: z.number().nullable(),
});

const macroTotalsSchema = nutrientsSchema.pick({
  caloriesKcal: true,
  proteinG: true,
  carbohydrateG: true,
  fatG: true,
});

/** A logged food as kept on the day: names and nutrients are copies (README §9.4). */
export const foodLogSchema = z.object({
  id: z.string(),
  logDate: localDate,
  ...mealRef,
  foodId: z.string(),
  foodName: z.string(),
  brand: z.string().nullable(),
  quantity: z.number(),
  unit: foodUnitSchema,
  nutrients: nutrientsSchema,
  consumedAt: z.string().nullable(),
});

// ------------------------------------------------------------ targets and water (README §9.4.1, §9.6)

const targetValues = {
  caloriesKcal: z.number().positive('Informe as calorias'),
  proteinG: z.number().min(0),
  carbohydrateG: z.number().min(0).nullable(),
  fatG: z.number().min(0).nullable(),
  waterMl: z.number().min(0).nullable(),
};

export const nutritionTargetInputSchema = z.object({ profileId: z.uuid(), ...targetValues });

export const nutritionTargetSchema = z.object({
  id: z.string(),
  effectiveFrom: localDate,
  ...targetValues,
  createdAt: z.string(),
});

export const waterLogInputSchema = z.object({
  profileId: z.uuid(),
  date: localDate,
  amountMl: z.number().positive('Informe a quantidade'),
});

export const waterLogIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

const waterLogSchema = z.object({ id: z.string(), amountMl: z.number(), loggedAt: z.string() });

export const nutritionDaySchema = z.object({
  date: localDate,
  logs: z.array(foodLogSchema),
  totals: z.object({ planned: macroTotalsSchema, consumed: macroTotalsSchema }),
  /** Target in force on the day, or null when the profile has none. */
  target: nutritionTargetSchema.nullable(),
  water: z.object({ totalMl: z.number(), logs: z.array(waterLogSchema) }),
});

// ------------------------------------------------------------ meal shortcuts (README §9.5)

const mealAt = z.object({ date: localDate, ...mealRef });

export const copyMealInputSchema = z.object({
  profileId: z.uuid(),
  from: mealAt,
  to: mealAt,
});

export const saveMealTemplateInputSchema = mealAt.extend({
  profileId: z.uuid(),
  name: z.string().trim().min(1, 'Informe o nome').max(40, 'Use até 40 caracteres'),
});

export const applyMealTemplateInputSchema = mealAt.extend({
  profileId: z.uuid(),
  templateId: z.uuid(),
});

export const mealTemplateIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });

/** A favorite meal: foods and quantities; values come from the current foods. */
export const mealTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(
    z.object({
      foodId: z.string(),
      foodName: z.string(),
      brand: z.string().nullable(),
      quantity: z.number(),
      unit: foodUnitSchema,
      caloriesKcal: z.number(),
    }),
  ),
  caloriesKcal: z.number(),
});

export type FoodUnit = z.infer<typeof foodUnitSchema>;
export type NutritionTargetInput = z.infer<typeof nutritionTargetInputSchema>;
export type NutritionTargetDto = z.infer<typeof nutritionTargetSchema>;
export type WaterLogInput = z.infer<typeof waterLogInputSchema>;
export type CopyMealInput = z.infer<typeof copyMealInputSchema>;
export type SaveMealTemplateInput = z.infer<typeof saveMealTemplateInputSchema>;
export type ApplyMealTemplateInput = z.infer<typeof applyMealTemplateInputSchema>;
export type MealTemplateDto = z.infer<typeof mealTemplateSchema>;
export type MealType = z.infer<typeof mealTypeSchema>;
export type FoodLogInput = z.infer<typeof foodLogInputSchema>;
export type FoodLogDto = z.infer<typeof foodLogSchema>;
export type NutritionDay = z.infer<typeof nutritionDaySchema>;
export type SetMealConsumedInput = z.infer<typeof setMealConsumedInputSchema>;
export type FoodInput = z.infer<typeof foodInputSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodInputSchema>;
export type FoodDto = z.infer<typeof foodSchema>;
