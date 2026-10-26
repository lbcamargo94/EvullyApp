import { type Kysely } from 'kysely';

type Row = [
  code: string,
  name: string,
  group: string,
  secondary: string[],
  equipment: string,
  instructions: string,
];

// System exercises (README §10.1, §10.7–10.9): profile_id null, read-only.
// Instructions are short, neutral descriptions of the movement, never medical advice.
const SYSTEM_EXERCISES: Row[] = [
  [
    'pull_up',
    'Barra fixa/puxada alta',
    'back',
    ['biceps'],
    'barra ou polia',
    'Pegada pronada um pouco além da largura dos ombros. Puxe levando os cotovelos para baixo até o queixo passar a barra (ou a barra chegar ao peito) e desça com controle.',
  ],
  [
    'neutral_pulldown',
    'Puxada neutra',
    'back',
    ['biceps'],
    'polia',
    'Pegada neutra. Puxe a barra em direção ao peito com o tronco levemente inclinado e volte com controle.',
  ],
  [
    'single_arm_pulldown',
    'Puxada unilateral',
    'back',
    ['biceps'],
    'polia',
    'Um braço por vez. Puxe o cotovelo para baixo e junto ao corpo e volte alongando as costas.',
  ],
  [
    'chest_supported_row',
    'Remada com apoio no peito',
    'back',
    ['biceps', 'shoulders'],
    'máquina ou halteres',
    'Peito apoiado no banco. Puxe levando os cotovelos para trás, aproximando as escápulas, e desça com controle.',
  ],
  [
    'supported_row',
    'Remada com apoio',
    'back',
    ['biceps'],
    'halter ou máquina',
    'Tronco apoiado e coluna neutra. Puxe o peso até a lateral do tronco e volte com controle.',
  ],
  [
    'seated_cable_row',
    'Remada baixa',
    'back',
    ['biceps'],
    'polia',
    'Sentado, coluna neutra. Puxe o cabo até o abdômen aproximando as escápulas e volte sem curvar a lombar.',
  ],
  [
    'reverse_fly',
    'Crucifixo inverso',
    'shoulders',
    ['back'],
    'máquina, polia ou halteres',
    'Braços quase estendidos. Abra para trás até a linha do corpo, focando a parte de trás dos ombros, e volte com controle.',
  ],
  [
    'bench_press',
    'Supino reto',
    'chest',
    ['triceps', 'shoulders'],
    'barra',
    'Escápulas aproximadas e pés firmes. Desça a barra até o peito com controle e empurre de volta.',
  ],
  [
    'incline_db_press',
    'Supino inclinado com halteres',
    'chest',
    ['triceps', 'shoulders'],
    'halteres',
    'Banco inclinado. Desça os halteres ao lado do peito e empurre para cima aproximando-os.',
  ],
  [
    'incline_machine_press',
    'Supino inclinado em máquina/Smith',
    'chest',
    ['triceps', 'shoulders'],
    'máquina ou Smith',
    'Banco inclinado. Desça até a parte alta do peito com controle e empurre de volta.',
  ],
  [
    'cable_crossover',
    'Crossover',
    'chest',
    ['shoulders'],
    'polia',
    'Cotovelos levemente flexionados. Traga os cabos à frente do peito e volte abrindo com controle.',
  ],
  [
    'machine_shoulder_press',
    'Desenvolvimento em máquina',
    'shoulders',
    ['triceps'],
    'máquina',
    'Costas apoiadas. Empurre para cima sem travar os cotovelos e desça com controle.',
  ],
  [
    'lateral_raise',
    'Elevação lateral',
    'shoulders',
    [],
    'halteres',
    'Eleve os braços pelas laterais até a altura dos ombros, cotovelos levemente flexionados, e desça devagar.',
  ],
  [
    'cable_lateral_raise',
    'Elevação lateral na polia',
    'shoulders',
    [],
    'polia',
    'Um braço por vez, cabo cruzando à frente do corpo. Eleve até a altura do ombro e desça devagar.',
  ],
  [
    'barbell_curl',
    'Rosca direta',
    'biceps',
    ['forearms'],
    'barra',
    'Cotovelos junto ao corpo. Flexione até contrair o bíceps e desça com controle, sem balançar o tronco.',
  ],
  [
    'incline_curl',
    'Rosca inclinada',
    'biceps',
    [],
    'halteres',
    'Sentado em banco inclinado, braços estendidos para baixo. Flexione os cotovelos sem avançá-los.',
  ],
  [
    'hammer_curl',
    'Rosca martelo',
    'biceps',
    ['forearms'],
    'halteres',
    'Pegada neutra (palmas voltadas para o corpo). Flexione os cotovelos mantendo-os junto ao tronco.',
  ],
  [
    'cable_curl',
    'Rosca na polia',
    'biceps',
    [],
    'polia',
    'Cotovelos fixos ao lado do corpo. Flexione até a contração e volte com controle.',
  ],
  [
    'reverse_curl',
    'Rosca inversa',
    'forearms',
    ['biceps'],
    'barra',
    'Pegada pronada (palmas para baixo). Flexione os cotovelos mantendo os punhos firmes.',
  ],
  [
    'wrist_curl',
    'Flexão de punho',
    'forearms',
    [],
    'barra ou halteres',
    'Antebraços apoiados, palmas para cima. Movimente só os punhos em amplitude confortável.',
  ],
  [
    'wrist_extension',
    'Extensão de punho',
    'forearms',
    [],
    'barra ou halteres',
    'Antebraços apoiados, palmas para baixo. Eleve o dorso das mãos movimentando só os punhos.',
  ],
  [
    'farmers_walk',
    "Farmer's Walk",
    'forearms',
    ['core'],
    'halteres',
    'Segure pesos ao lado do corpo, tronco ereto, e caminhe com passos curtos pelo tempo definido.',
  ],
  [
    'dead_hang',
    'Dead Hang',
    'forearms',
    ['back'],
    'barra',
    'Pendure-se na barra com os braços estendidos e ombros ativos pelo tempo definido.',
  ],
  [
    'triceps_rope',
    'Tríceps corda',
    'triceps',
    [],
    'polia',
    'Cotovelos junto ao corpo. Estenda os braços abrindo a corda no final e volte com controle.',
  ],
  [
    'triceps_pushdown',
    'Tríceps na polia',
    'triceps',
    [],
    'polia',
    'Cotovelos fixos ao lado do corpo. Estenda os braços para baixo e volte até 90 graus.',
  ],
  [
    'overhead_triceps_extension',
    'Extensão de tríceps acima da cabeça',
    'triceps',
    [],
    'polia ou halter',
    'Braços acima da cabeça. Flexione os cotovelos levando o peso para trás e estenda de volta.',
  ],
  [
    'leg_press',
    'Leg Press',
    'quadriceps',
    ['glutes'],
    'máquina',
    'Costas apoiadas. Desça a plataforma com controle sem tirar a lombar do encosto e empurre de volta.',
  ],
  [
    'leg_press_45',
    'Leg Press 45°',
    'quadriceps',
    ['glutes'],
    'máquina',
    'Costas apoiadas no banco a 45°. Desça com controle e empurre sem travar os joelhos.',
  ],
  [
    'smith_hack_squat',
    'Smith Squat ou Hack Squat',
    'quadriceps',
    ['glutes'],
    'Smith ou máquina',
    'Pés firmes, tronco estável. Agache até a profundidade confortável e suba empurrando o chão.',
  ],
  [
    'leg_extension',
    'Cadeira extensora',
    'quadriceps',
    [],
    'máquina',
    'Estenda os joelhos até quase travar e desça com controle.',
  ],
  [
    'lunge',
    'Afundo/passada',
    'quadriceps',
    ['glutes'],
    'peso corporal ou halteres',
    'Dê um passo e desça até os dois joelhos ficarem perto de 90 graus; volte empurrando com a perna da frente.',
  ],
  [
    'romanian_deadlift',
    'Romanian Deadlift/Stiff',
    'hamstrings',
    ['glutes', 'lower_back'],
    'barra ou halteres',
    'Joelhos levemente flexionados e coluna neutra. Leve o quadril para trás descendo o peso rente às pernas e volte.',
  ],
  [
    'leg_curl',
    'Flexora',
    'hamstrings',
    [],
    'máquina',
    'Flexione os joelhos trazendo o apoio em direção aos glúteos e volte com controle.',
  ],
  [
    'calf_raise',
    'Panturrilha',
    'calves',
    [],
    'máquina ou peso corporal',
    'Suba na ponta dos pés o máximo possível, pause e desça alongando a panturrilha.',
  ],
  [
    'back_extension_45',
    'Hiperextensão 45°',
    'lower_back',
    ['glutes', 'hamstrings'],
    'banco 45°',
    'Quadril apoiado. Desça o tronco com a coluna neutra e suba até alinhar com as pernas, sem hiperestender.',
  ],
  [
    'reverse_crunch',
    'Abdominal reverso',
    'core',
    [],
    'peso corporal',
    'Deitado, eleve o quadril trazendo os joelhos em direção ao peito e desça devagar.',
  ],
  [
    'controlled_crunch',
    'Crunch controlado',
    'core',
    [],
    'peso corporal',
    'Deitado, joelhos flexionados. Eleve as escápulas do chão contraindo o abdômen e desça devagar.',
  ],
  [
    'dead_bug',
    'Dead Bug',
    'core',
    ['lower_back'],
    'peso corporal',
    'Deitado, braços e joelhos elevados. Estenda braço e perna opostos mantendo a lombar no chão; alterne.',
  ],
  [
    'side_plank',
    'Prancha lateral',
    'core',
    [],
    'peso corporal',
    'Apoiado no antebraço e na lateral do pé, mantenha o corpo alinhado pelo tempo definido.',
  ],
  [
    'bird_dog',
    'Bird Dog',
    'core',
    ['lower_back', 'glutes'],
    'peso corporal',
    'Em quatro apoios, estenda braço e perna opostos mantendo o tronco estável; alterne.',
  ],
  [
    'front_plank',
    'Prancha frontal',
    'core',
    [],
    'peso corporal',
    'Apoiado nos antebraços e pontas dos pés, mantenha o corpo alinhado pelo tempo definido.',
  ],
  [
    'bike_warmup',
    'Bike (aquecimento)',
    'cardio_other',
    [],
    'bicicleta ergométrica',
    'Pedale em ritmo leve a moderado pelo tempo definido.',
  ],
];

const SEEDED_AT = '2026-10-25T00:00:00.000Z';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('exercises')
    .addColumn('id', 'text', (c) => c.primaryKey())
    .addColumn('profile_id', 'text', (c) => c.references('profiles.id').onDelete('cascade'))
    .addColumn('code', 'text', (c) => c.unique())
    .addColumn('name', 'text', (c) => c.notNull())
    .addColumn('muscle_group', 'text', (c) => c.notNull())
    .addColumn('secondary_muscles', 'text', (c) => c.notNull())
    .addColumn('equipment', 'text')
    .addColumn('instructions', 'text')
    .addColumn('notes', 'text')
    .addColumn('load_increment_kg', 'real')
    .addColumn('is_active', 'integer', (c) => c.notNull().defaultTo(1))
    .addColumn('created_at', 'text', (c) => c.notNull())
    .addColumn('updated_at', 'text', (c) => c.notNull())
    .execute();
  await db.schema.createIndex('exercises_profile').on('exercises').column('profile_id').execute();

  await (db as Kysely<{ exercises: Record<string, unknown> }>)
    .insertInto('exercises')
    .values(
      SYSTEM_EXERCISES.map(([code, name, group, secondary, equipment, instructions], i) => ({
        id: `01930000-0000-7000-8000-${String(i + 1).padStart(12, '0')}`,
        profile_id: null,
        code,
        name,
        muscle_group: group,
        secondary_muscles: JSON.stringify(secondary),
        equipment,
        instructions,
        notes: null,
        load_increment_kg: null,
        is_active: 1,
        created_at: SEEDED_AT,
        updated_at: SEEDED_AT,
      })),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('exercises').execute();
}
