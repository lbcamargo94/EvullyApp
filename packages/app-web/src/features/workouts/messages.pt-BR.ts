import type { MuscleGroup, PrescriptionDto } from '@evully/contracts';

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraço',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posteriores',
  glutes: 'Glúteos',
  calves: 'Panturrilha',
  core: 'Abdômen/core',
  lower_back: 'Lombar',
  cardio_other: 'Cardio/outros',
};

export const workoutMessages = {
  title: 'Treinos',
  tabs: { session: 'Treinar', plans: 'Planos', exercises: 'Exercícios' },
} as const;

export const exerciseMessages = {
  listTitle: 'Biblioteca',
  count: (n: number) => (n === 1 ? '1 exercício' : `${n} exercícios`),
  search: 'Buscar exercício',
  searchPlaceholder: 'Buscar por nome ou equipamento',
  group: 'Grupo muscular',
  allGroups: 'Todos os grupos',
  noResults: 'Nenhum exercício encontrado.',
  system: 'Evully',
  own: 'Meu',
  systemHint: 'Exercício do catálogo do Evully (não editável).',
  details: (name: string) => `Detalhes de ${name}`,
  equipment: 'Equipamento',
  secondary: 'Também trabalha',
  increment: 'Incremento de carga',
  incrementValue: (kg: string) => `${kg} kg`,
  instructionsTitle: 'Como fazer',
  formTitle: 'Novo exercício',
  editTitle: 'Editar exercício',
  name: 'Nome',
  namePlaceholder: 'Ex.: Remada cavalinho',
  mainGroup: 'Grupo muscular principal',
  secondaryGroups: 'Grupos secundários',
  equipmentLabel: 'Equipamento',
  equipmentPlaceholder: 'Ex.: barra, halteres, polia',
  incrementLabel: 'Incremento de carga (kg)',
  incrementHint: 'Usado nas sugestões de progressão.',
  instructions: 'Como fazer',
  notes: 'Notas',
  optional: 'opcional',
  save: 'Salvar exercício',
  saveEdit: 'Salvar alterações',
  saving: 'Salvando…',
  cancel: 'Cancelar',
  saved: (name: string) => `${name} salvo.`,
  edit: (name: string) => `Editar ${name}`,
  remove: (name: string) => `Desativar ${name}`,
  removeTitle: 'Desativar exercício?',
  removeBody: (name: string) =>
    `“${name}” sai da biblioteca. O que já foi registrado com ele continua no histórico.`,
  removeConfirm: 'Desativar',
  invalidIncrement: 'Confira o incremento de carga.',
  genericError: 'Não foi possível salvar. Tente novamente.',
} as const;

export const exerciseErrorByCode: Record<string, string> = {
  'exercise.name_required': 'Informe o nome do exercício.',
  'exercise.name_too_long': 'Use até 60 caracteres no nome.',
  'exercise.invalid_group': 'Escolha o grupo muscular.',
  'exercise.increment_out_of_range': 'O incremento precisa ser maior que zero e até 50 kg.',
  'exercise.equipment_too_long': 'Use até 40 caracteres no equipamento.',
  'exercise.instructions_too_long': 'Use até 1.000 caracteres em “Como fazer”.',
  'exercise.notes_too_long': 'Use até 500 caracteres nas notas.',
  'exercise.duplicate': 'Já existe um exercício com esse nome.',
  'exercise.not_found': 'Exercício não encontrado. Recarregue a tela.',
};

export const weekdayLabels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const range = (min: number | null, max: number | null) =>
  min === null ? null : min === max ? String(min) : `${min}–${max}`;

/** "3 × 6–8 · RIR 1–2 · descanso 150–180 s" (README §10.3). */
export function formatPrescription(p: PrescriptionDto): string {
  const target =
    p.targetType === 'reps'
      ? `${p.sets} × ${range(p.minReps, p.maxReps)}`
      : `${p.sets} × ${range(p.minSeconds, p.maxSeconds)} s`;
  const parts = [p.perSide ? `${target} por lado` : target];
  const rir = range(p.minRir, p.maxRir);
  if (rir !== null) parts.push(`RIR ${rir}`);
  const rest = range(p.minRestSeconds, p.maxRestSeconds);
  if (rest !== null) parts.push(`descanso ${rest} s`);
  return parts.join(' · ');
}

export const planMessages = {
  empty: 'Nenhum plano ainda. Crie um ou importe um plano-modelo.',
  newPlan: 'Novo plano',
  planName: 'Nome do plano',
  create: 'Criar',
  importTemplate: 'Importar plano-modelo',
  templates: {
    cutting_2026: 'Cutting 2026 (segunda a sexta)',
    core_home: 'Core em casa (3× por semana)',
  },
  importHint: 'A importação cria uma cópia que você pode editar à vontade.',
  importAction: 'Importar',
  active: 'Planos ativos',
  archived: 'Arquivados',
  open: (name: string) => `Abrir ${name}`,
  summary: (days: number, exercises: number) =>
    `${days} ${days === 1 ? 'dia' : 'dias'} · ${exercises} ${exercises === 1 ? 'exercício' : 'exercícios'}`,
  back: 'Voltar aos planos',
  rename: 'Renomear',
  save: 'Salvar',
  cancel: 'Cancelar',
  archive: 'Arquivar',
  restore: 'Restaurar',
  addDay: 'Adicionar dia',
  dayName: 'Nome do dia',
  dayNamePlaceholder: 'Ex.: PUSH',
  weekday: 'Dia da semana',
  noWeekday: 'Sem dia fixo',
  moveUp: (name: string) => `Subir ${name}`,
  moveDown: (name: string) => `Descer ${name}`,
  editDay: (name: string) => `Editar ${name}`,
  removeDay: (name: string) => `Remover ${name}`,
  removeDayTitle: 'Remover este dia?',
  removeDayBody: (name: string) => `“${name}” e os exercícios dele saem do plano.`,
  remove: 'Remover',
  noExercises: 'Nenhum exercício neste dia.',
  addExercise: 'Adicionar exercício',
  searchExercise: 'Buscar exercício na biblioteca',
  noMatch: 'Nenhum exercício encontrado.',
  editPrescription: (name: string) => `Editar prescrição de ${name}`,
  removeExercise: (name: string) => `Remover ${name} do dia`,
  inactive: 'desativado na biblioteca',
  genericError: 'Não foi possível salvar. Tente novamente.',
} as const;

export const prescriptionMessages = {
  sets: 'Séries',
  target: 'Meta',
  reps: 'Repetições',
  seconds: 'Segundos',
  min: 'Mín.',
  max: 'Máx.',
  perSide: 'Por lado',
  rir: 'RIR',
  rest: 'Descanso (s)',
  notes: 'Notas',
  optional: 'opcional',
  save: 'Salvar',
  add: 'Adicionar',
  cancel: 'Cancelar',
  invalid: 'Confira os números: use inteiros.',
} as const;

export const planErrorByCode: Record<string, string> = {
  'workout_plan.name_required': 'Informe o nome do plano.',
  'workout_plan.name_too_long': 'Use até 60 caracteres no nome do plano.',
  'workout_plan.duplicate': 'Já existe um plano com esse nome.',
  'workout_plan.not_found': 'Plano não encontrado. Recarregue a tela.',
  'workout_day.name_required': 'Informe o nome do dia.',
  'workout_day.name_too_long': 'Use até 40 caracteres no nome do dia.',
  'workout_day.invalid_weekday': 'Escolha um dia da semana válido.',
  'workout_day.not_found': 'Dia não encontrado. Recarregue a tela.',
  'plan_exercise.not_found': 'Exercício não encontrado no plano. Recarregue a tela.',
  'exercise.not_found': 'Exercício não encontrado na biblioteca.',
  'prescription.sets_out_of_range': 'Use de 1 a 20 séries.',
  'prescription.reps_out_of_range': 'Repetições de 1 a 100, com mínimo até o máximo.',
  'prescription.seconds_out_of_range': 'Segundos de 1 a 3.600, com mínimo até o máximo.',
  'prescription.target_required': 'Informe as repetições ou os segundos.',
  'prescription.rir_out_of_range': 'RIR de 0 a 10, com mínimo até o máximo.',
  'prescription.rest_out_of_range': 'Descanso de 0 a 900 s, com mínimo até o máximo.',
  'prescription.notes_too_long': 'Use até 200 caracteres nas notas.',
};

const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const kg = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export const sessionMessages = {
  startTitle: 'Iniciar treino',
  startHint: 'Escolha o dia do plano. O de hoje vem marcado quando o plano tem dia da semana.',
  noPlans:
    'Você ainda não tem planos ativos. Crie ou importe um na aba Planos, ou faça um treino livre.',
  today: 'hoje',
  start: 'Iniciar',
  free: 'Treino livre',
  startedAt: (iso: string) => `Iniciado às ${time.format(new Date(iso))}`,
  freeSession: 'Treino livre',
  target: 'Meta',
  last: 'Última sessão',
  lastValue: (weight: number | null, values: number[], unit: 'reps' | 'seconds', iso: string) => {
    const load = weight === null ? '' : `${kg.format(weight)} kg · `;
    const list = values.join(' / ') + (unit === 'seconds' ? ' s' : '');
    return `${load}${list} (${shortDate.format(new Date(iso))})`;
  },
  noLast: 'Primeira vez com este exercício.',
  set: (n: number) => `Série ${n}`,
  load: 'Carga (kg)',
  reps: 'Reps',
  seconds: 'Tempo (s)',
  rir: 'RIR',
  doneLabel: (n: number) => `Série ${n} concluída`,
  removeSet: (n: number) => `Remover série ${n}`,
  addSet: 'Série',
  swap: 'Trocar exercício',
  removeExercise: (name: string) => `Remover ${name} do treino`,
  addExercise: 'Adicionar exercício',
  rest: (label: string) => `Iniciar descanso ${label}`,
  resting: (label: string) => `Descanso ${label}`,
  restDone: 'Descanso concluído',
  suggestion: (increment: string | null) =>
    `Na última sessão você fez todas as séries no topo da faixa. Sugestão: considere aumentar a carga${
      increment ? ` (+${increment} kg)` : ''
    }. Você decide.`,
  stop: 'Parar',
  notes: 'Notas do treino',
  finish: 'Finalizar treino',
  finishing: 'Finalizando…',
  discard: 'Descartar treino',
  discardTitle: 'Descartar este treino?',
  discardBody: 'As séries registradas neste treino serão descartadas.',
  invalidNumber: 'Confira os números da série.',
  cancel: 'Cancelar',
  genericError: 'Não foi possível salvar. Tente novamente.',
} as const;

export const sessionErrorByCode: Record<string, string> = {
  'workout_session.open_exists': 'Já existe um treino em andamento.',
  'workout_session.not_found': 'Treino não encontrado. Recarregue a tela.',
  'workout_session.finished': 'Este treino já foi finalizado.',
  'workout_session.nothing_done': 'Marque pelo menos uma série como concluída antes de finalizar.',
  'workout_session.notes_too_long': 'Use até 500 caracteres nas notas.',
  'workout_day.not_found': 'Dia do plano não encontrado. Recarregue a tela.',
  'exercise.not_found': 'Exercício não encontrado na biblioteca.',
  'set.weight_out_of_range': 'Use uma carga de 0 a 1.000 kg.',
  'set.reps_out_of_range': 'Use repetições inteiras de 0 a 1.000.',
  'set.seconds_out_of_range': 'Use um tempo inteiro em segundos.',
  'set.rir_out_of_range': 'Use RIR inteiro de 0 a 10.',
  'set.notes_too_long': 'Use até 200 caracteres nas notas da série.',
};

const longDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
export const formatKgValue = (n: number) => kg.format(n);
export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));

export const historyMessages = {
  open: (name: string) => `Histórico de ${name}`,
  title: 'Histórico',
  empty: 'Nenhum treino finalizado com este exercício ainda.',
  bestLoad: 'Melhor carga',
  bestSet: 'Melhor série',
  recent: 'Últimas 4 semanas',
  recentValue: (n: number) => (n === 1 ? '1 sessão' : `${n} sessões`),
  lastSession: 'Última sessão',
  kg: (value: string) => `${value} kg`,
  setValue: (weight: string, reps: number | null) =>
    reps === null ? `${weight} kg` : `${weight} kg × ${reps}`,
  on: (iso: string) => `em ${longDate.format(new Date(iso))}`,
  chartTitle: 'Carga máxima por sessão',
  chartAlt: (n: number, first: string, last: string) =>
    `Gráfico da carga máxima em ${n} sessões, de ${first} a ${last}.`,
  sessions: 'Sessões',
  volume: (value: string) => `volume ${value} kg`,
  incrementTitle: 'Incremento de carga',
  incrementHint: 'Usado nas sugestões de progressão. Vale só para este perfil.',
  incrementLabel: 'Incremento (kg)',
  incrementSave: 'Salvar',
  incrementSaved: 'Incremento salvo.',
  invalidIncrement: 'Use um número maior que zero e até 50.',
  genericError: 'Não foi possível salvar. Tente novamente.',
} as const;

export const workoutQuestionnaireMessages = {
  introTitle: 'Vamos ajustar os Treinos para você',
  introBody:
    'Quatro perguntas rápidas. As respostas sugerem planos-modelo; você decide se quer usar. Dá para refazer em Configurações › Treino.',
  experienceTitle: 'Qual é a sua experiência com musculação?',
  experience: { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' },
  daysTitle: 'Quantos dias por semana você pode treinar?',
  days: (n: number) => (n === 1 ? '1 dia' : `${n} dias`),
  locationTitle: 'Onde você treina?',
  location: { gym: 'Academia', home: 'Em casa', both: 'Nos dois' },
  equipmentTitle: 'Quais equipamentos você tem à disposição?',
  equipment: {
    barbell: 'Barra',
    dumbbells: 'Halteres',
    machines: 'Máquinas',
    cables: 'Polia',
    bench: 'Banco',
    none: 'Nenhum',
  },
  optional: 'opcional',
  save: 'Salvar',
  saving: 'Salvando…',
  skip: 'Pular',
  cancel: 'Cancelar',
  invalidDays: 'Escolha de 1 a 7 dias.',
  genericError: 'Não foi possível salvar. Tente novamente.',
  suggestionsTitle: 'Sugestões para você',
  suggestionsHint: 'Pelas suas respostas. Importar cria uma cópia editável; nada é feito sem você.',
  reasons: {
    gym_five_days: 'Academia, 5 ou mais dias por semana.',
    home_core: 'Para treinar em casa.',
    core_complement: 'Complemento de core para fazer em casa.',
  },
  buildOwn:
    'O Cutting 2026 tem 5 dias. Com menos dias, monte seu plano em “Novo plano” usando a biblioteca.',
  importAction: 'Importar',
  imported: (name: string) => `“${name}” importado.`,
  settingsTitle: 'Preferências de treino',
  settingsExperience: 'Experiência',
  settingsDays: 'Dias por semana',
  settingsLocation: 'Local',
  settingsEquipment: 'Equipamentos',
  notAnswered: 'Não informado',
  redo: 'Refazer questionário',
} as const;
