import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type { MealTemplateRecord, MealTemplateRepository } from '../ports/meal-template-repository';

export class KyselyMealTemplateRepository implements MealTemplateRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private async withItems(
    rows: { id: string; profile_id: string; name: string; created_at: string }[],
  ): Promise<MealTemplateRecord[]> {
    if (!rows.length) return [];
    const items = await this.db
      .selectFrom('meal_template_items')
      .select(['meal_template_id', 'food_id', 'quantity'])
      .where(
        'meal_template_id',
        'in',
        rows.map((r) => r.id),
      )
      .orderBy('sort_order')
      .execute();
    return rows.map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      name: r.name,
      createdAt: r.created_at,
      items: items
        .filter((i) => i.meal_template_id === r.id)
        .map((i) => ({ foodId: i.food_id, quantity: i.quantity })),
    }));
  }

  private active(profileId: string) {
    return this.db
      .selectFrom('meal_templates')
      .select(['id', 'profile_id', 'name', 'created_at'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  async list(profileId: string): Promise<MealTemplateRecord[]> {
    return this.withItems(await this.active(profileId).orderBy('name').orderBy('id').execute());
  }

  async findById(profileId: string, id: string): Promise<MealTemplateRecord | null> {
    const row = await this.active(profileId).where('id', '=', id).executeTakeFirst();
    return row ? ((await this.withItems([row]))[0] ?? null) : null;
  }

  async insert(template: MealTemplateRecord, newId: () => string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('meal_templates')
        .values({
          id: template.id,
          profile_id: template.profileId,
          name: template.name,
          created_at: template.createdAt,
          updated_at: template.createdAt,
        })
        .execute();
      for (const [index, item] of template.items.entries()) {
        await trx
          .insertInto('meal_template_items')
          .values({
            id: newId(),
            meal_template_id: template.id,
            food_id: item.foodId,
            quantity: item.quantity,
            sort_order: index + 1,
            created_at: template.createdAt,
          })
          .execute();
      }
    });
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('meal_templates')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async isFoodUsed(foodId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('meal_template_items as i')
      .innerJoin('meal_templates as t', 't.id', 'i.meal_template_id')
      .select('i.id')
      .where('i.food_id', '=', foodId)
      .where('t.deleted_at', 'is', null)
      .executeTakeFirst();
    return row !== undefined;
  }
}
