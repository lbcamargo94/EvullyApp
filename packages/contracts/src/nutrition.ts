import { z } from 'zod';

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

export type FoodUnit = z.infer<typeof foodUnitSchema>;
export type FoodInput = z.infer<typeof foodInputSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodInputSchema>;
export type FoodDto = z.infer<typeof foodSchema>;
