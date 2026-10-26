import { z } from 'zod';

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const habitTypeSchema = z.enum(['boolean', 'quantity', 'duration', 'time']);

const habitValues = {
  name: z.string().trim().min(1, 'Informe o nome').max(40, 'Use até 40 caracteres'),
  type: habitTypeSchema,
  unit: z.string().trim().max(15, 'Use até 15 caracteres').nullable(),
  targetValue: z.number().positive().nullable(),
};

export const habitInputSchema = z.object({ profileId: z.uuid(), ...habitValues });
export const updateHabitInputSchema = habitInputSchema.extend({ id: z.uuid() });
export const habitIdInputSchema = z.object({ profileId: z.uuid(), id: z.uuid() });
export const moveHabitInputSchema = habitIdInputSchema.extend({
  direction: z.enum(['up', 'down']),
});
export const habitDayInputSchema = z.object({ profileId: z.uuid(), date: localDate });
export const setHabitLogInputSchema = habitDayInputSchema.extend({
  habitId: z.uuid(),
  /** Null clears the day. */
  value: z.number().min(0).nullable(),
});

export const habitSchema = z.object({ id: z.string(), ...habitValues });

/** The day's habits with their values and the last 7 days (oldest first). */
export const habitDaySchema = z.object({
  date: localDate,
  habits: z.array(
    habitSchema.extend({
      value: z.number().nullable(),
      done: z.boolean(),
      last7: z.array(z.boolean()),
    }),
  ),
});

export type HabitType = z.infer<typeof habitTypeSchema>;
export type HabitInput = z.infer<typeof habitInputSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitInputSchema>;
export type HabitDto = z.infer<typeof habitSchema>;
export type HabitDay = z.infer<typeof habitDaySchema>;
