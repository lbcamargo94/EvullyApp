import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, FoodsTable } from '../../../database/schema';
import type { FoodRecord, FoodRepository } from '../ports/food-repository';

const toRecord = (r: Selectable<FoodsTable>): FoodRecord => ({
  id: r.id,
  name: r.name,
  brand: r.brand,
  referenceAmount: r.reference_amount,
  referenceUnit: r.reference_unit,
  caloriesKcal: r.calories_kcal,
  proteinG: r.protein_g,
  carbohydrateG: r.carbohydrate_g,
  fatG: r.fat_g,
  fiberG: r.fiber_g,
  sodiumMg: r.sodium_mg,
  source: r.source,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (f: FoodRecord) => ({
  name: f.name,
  brand: f.brand,
  reference_amount: f.referenceAmount,
  reference_unit: f.referenceUnit,
  calories_kcal: f.caloriesKcal,
  protein_g: f.proteinG,
  carbohydrate_g: f.carbohydrateG,
  fat_g: f.fatG,
  fiber_g: f.fiberG,
  sodium_mg: f.sodiumMg,
  source: f.source,
  updated_at: f.updatedAt,
});

export class KyselyFoodRepository implements FoodRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private active() {
    return this.db.selectFrom('foods').selectAll().where('deleted_at', 'is', null);
  }

  async list(): Promise<FoodRecord[]> {
    const rows = await this.active().orderBy('name').orderBy('brand').orderBy('id').execute();
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<FoodRecord | null> {
    const row = await this.active().where('id', '=', id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async insert(food: FoodRecord): Promise<void> {
    await this.db
      .insertInto('foods')
      .values({ id: food.id, created_at: food.createdAt, ...toRow(food) })
      .execute();
  }

  async update(food: FoodRecord): Promise<void> {
    await this.db
      .updateTable('foods')
      .set(toRow(food))
      .where('id', '=', food.id)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async softDelete(id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('foods')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }
}
