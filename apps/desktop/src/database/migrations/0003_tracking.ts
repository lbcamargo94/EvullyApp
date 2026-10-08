import { sql, type Kysely } from 'kysely';

// Tracking: measurement catalog, projects, questionnaire answers, configs with
// history, per-profile measurements and weighing tags (README §8.3).

const CREATED = '2026-10-07T00:00:00.000Z';

/** System measurement catalog with fixed ids, so every installation shares them. */
const MEASUREMENT_TYPES: [code: string, name: string, region: string, csv: string, how: string][] =
  [
    [
      'waist',
      'Cintura',
      'waist',
      'cintura',
      'Parte mais estreita do tronco, entre as costelas e o umbigo, ao fim de uma expiração normal.',
    ],
    ['abdomen', 'Abdômen', 'waist', 'abdomen', 'Na altura do umbigo, com o abdômen relaxado.'],
    [
      'hips',
      'Quadril',
      'hips',
      'quadril',
      'Parte mais larga dos glúteos, em pé com os pés juntos.',
    ],
    [
      'chest',
      'Tórax/busto',
      'chest',
      'torax',
      'Parte mais larga do tórax, na linha dos mamilos, braços relaxados.',
    ],
    [
      'right_arm',
      'Braço relaxado direito',
      'arms',
      'braco_relaxado_d',
      'Ponto médio entre ombro e cotovelo, braço solto ao lado do corpo.',
    ],
    [
      'left_arm',
      'Braço relaxado esquerdo',
      'arms',
      'braco_relaxado_e',
      'Ponto médio entre ombro e cotovelo, braço solto ao lado do corpo.',
    ],
    [
      'right_biceps',
      'Bíceps contraído direito',
      'arms',
      'biceps_contraido_d',
      'Ponto mais alto do bíceps, braço flexionado e contraído.',
    ],
    [
      'left_biceps',
      'Bíceps contraído esquerdo',
      'arms',
      'biceps_contraido_e',
      'Ponto mais alto do bíceps, braço flexionado e contraído.',
    ],
    [
      'right_thigh',
      'Coxa direita',
      'legs',
      'coxa_d',
      'Ponto médio entre a virilha e o joelho, em pé.',
    ],
    [
      'left_thigh',
      'Coxa esquerda',
      'legs',
      'coxa_e',
      'Ponto médio entre a virilha e o joelho, em pé.',
    ],
    [
      'right_calf',
      'Panturrilha direita',
      'legs',
      'panturrilha_d',
      'Parte mais larga da panturrilha, em pé.',
    ],
    [
      'left_calf',
      'Panturrilha esquerda',
      'legs',
      'panturrilha_e',
      'Parte mais larga da panturrilha, em pé.',
    ],
    ['neck', 'Pescoço', 'other', 'pescoco', 'Logo abaixo do pomo de adão, olhando para a frente.'],
  ];

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('measurement_types')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('code', 'text', (c) => c.notNull().unique())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('body_region', 'text', (c) =>
      c.notNull().check(sql`body_region in ('waist', 'hips', 'arms', 'legs', 'chest', 'other')`),
    )
    .addColumn('unit', 'text', (c) => c.notNull().defaultTo('cm'))
    .addColumn('instructions', 'text', (c) => c.notNull())
    .addColumn('csv_name', 'text', (c) => c.notNull().unique())
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('is_active', 'integer', (c) => c.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();

  await db
    .withTables<{ measurement_types: Record<string, string | number> }>()
    .insertInto('measurement_types')
    .values(
      MEASUREMENT_TYPES.map(([code, name, region, csv, how], i) => ({
        id: `01920000-0000-7000-8000-${String(i + 1).padStart(12, '0')}`,
        code,
        name,
        body_region: region,
        instructions: how,
        csv_name: csv,
        sort_order: i + 1,
        created_at: CREATED,
        updated_at: CREATED,
      })),
    )
    .execute();

  await db.schema
    .createTable('projects')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('objective', 'text', (c) =>
      c
        .notNull()
        .check(sql`objective in ('fat_loss', 'muscle_gain', 'recomposition', 'maintenance')`),
    )
    .addColumn('start_date', 'text', (c) => c.notNull())
    .addColumn('target_date', 'text', (c) => c.notNull())
    .addColumn('status', 'text', (c) =>
      c.notNull().check(sql`status in ('active', 'completed', 'archived')`),
    )
    .addColumn('notes', 'text')
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  // At most one active project per profile (README §7.1).
  await sql`CREATE UNIQUE INDEX projects_one_active ON projects (profile_id) WHERE status = 'active' AND deleted_at IS NULL`.execute(
    db,
  );

  await db.schema
    .createTable('profile_questionnaires')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('questionnaire_code', 'text', (c) => c.notNull())
    .addColumn('questionnaire_version', 'text', (c) => c.notNull())
    .addColumn('answers', 'text', (c) => c.notNull())
    .addColumn('status', 'text', (c) => c.notNull().check(sql`status in ('completed', 'skipped')`))
    .addColumn('completed_at', 'text', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('profile_questionnaires_profile')
    .on('profile_questionnaires')
    .columns(['profile_id', 'completed_at'])
    .execute();

  await db.schema
    .createTable('tracking_configs')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('effective_from', 'text', (c) => c.notNull())
    .addColumn('weight_display', 'text', (c) =>
      c.notNull().check(sql`weight_display in ('trend', 'daily', 'hidden')`),
    )
    .addColumn('focus_areas', 'text', (c) => c.notNull())
    .addColumn('enabled_modules', 'text', (c) => c.notNull().defaultTo('[]'))
    .addColumn('source', 'text', (c) =>
      c.notNull().check(sql`source in ('questionnaire', 'manual', 'template', 'professional')`),
    )
    .addColumn('rule_version', 'text')
    .addColumn('questionnaire_id', 'text', (c) => c.references('profile_questionnaires.id'))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex('tracking_configs_profile_date')
    .on('tracking_configs')
    .columns(['profile_id', 'effective_from'])
    .execute();

  await db.schema
    .createTable('profile_measurement_types')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('measurement_type_id', 'text', (c) => c.notNull().references('measurement_types.id'))
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('is_active', 'integer', (c) => c.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addUniqueConstraint('profile_measurement_types_unique', ['profile_id', 'measurement_type_id'])
    .execute();

  await db.schema
    .createTable('tags')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) =>
      c.notNull().references('profiles.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('sort_order', 'integer', (c) => c.notNull())
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .addColumn('deleted_at', 'text')
    .execute();
  await sql`CREATE UNIQUE INDEX tags_profile_name ON tags (profile_id, name) WHERE deleted_at IS NULL`.execute(
    db,
  );
}

export async function down(db: Kysely<unknown>): Promise<void> {
  for (const table of [
    'tags',
    'profile_measurement_types',
    'tracking_configs',
    'profile_questionnaires',
    'projects',
    'measurement_types',
  ]) {
    await db.schema.dropTable(table).execute();
  }
}
