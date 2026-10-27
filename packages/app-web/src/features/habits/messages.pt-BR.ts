import type { HabitType } from '@evully/contracts';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'narrow' });

export const formatNumber = (n: number) => number.format(n);
export const formatWeekdayLetter = (date: string) =>
  weekdayShort.format(new Date(`${date}T12:00:00`));

/** Minutes since midnight ↔ "HH:MM". */
export const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const timeToMinutes = (t: string) => {
  const match = /^(\d{2}):(\d{2})$/.exec(t);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

export const habitTypeLabels: Record<HabitType, string> = {
  boolean: 'Sim/não',
  quantity: 'Quantidade',
  duration: 'Duração (min)',
  time: 'Horário',
};

export const habitMessages = {
  title: 'Hábitos',
  tabs: { day: 'Dia', manage: 'Gerenciar' },
  previousDay: 'Dia anterior',
  nextDay: 'Próximo dia',
  today: 'Hoje',
  backToToday: 'Voltar para hoje',
  empty: 'Nenhum hábito ainda. Crie em Gerenciar ou adicione os exemplos.',
  addExamples: 'Adicionar exemplos',
  examplesHint: 'Creatina e Passos (meta 8.000).',
  done: 'Cumprido',
  done7: (n: number) => `${n} de 7 dias`,
  last7: 'Últimos 7 dias',
  dayDone: (date: string, done: boolean) => `${date}: ${done ? 'cumprido' : 'não cumprido'}`,
  valueOf: (name: string) => `Valor de ${name}`,
  target: (value: string, unit: string | null) => `meta ${value}${unit ? ` ${unit}` : ''}`,
  minutesUnit: 'min',
  clear: (name: string) => `Limpar ${name} neste dia`,
  invalidValue: 'Confira o valor.',
  genericError: 'Não foi possível salvar. Tente novamente.',
  formTitle: 'Novo hábito',
  editTitle: 'Editar hábito',
  name: 'Nome',
  namePlaceholder: 'Ex.: Creatina',
  type: 'Tipo',
  unit: 'Unidade',
  unitPlaceholder: 'Ex.: passos',
  targetLabel: 'Meta diária',
  optional: 'opcional',
  save: 'Salvar',
  saveEdit: 'Salvar alterações',
  cancel: 'Cancelar',
  saved: (name: string) => `${name} salvo.`,
  list: 'Seus hábitos',
  moveUp: (name: string) => `Subir ${name}`,
  moveDown: (name: string) => `Descer ${name}`,
  edit: (name: string) => `Editar ${name}`,
  remove: (name: string) => `Desativar ${name}`,
  removeTitle: 'Desativar este hábito?',
  removeBody: (name: string) => `“${name}” sai da lista. Os registros feitos continuam guardados.`,
  removeConfirm: 'Desativar',
} as const;

export const habitErrorByCode: Record<string, string> = {
  'habit.name_required': 'Informe o nome do hábito.',
  'habit.name_too_long': 'Use até 40 caracteres no nome.',
  'habit.duplicate': 'Já existe um hábito com esse nome.',
  'habit.unit_too_long': 'Use até 15 caracteres na unidade.',
  'habit.target_out_of_range': 'Confira a meta.',
  'habit.value_out_of_range': 'Confira o valor.',
  'habit.date_in_future': 'Hábitos são registrados no próprio dia ou em dias passados.',
  'habit.not_found': 'Hábito não encontrado. Recarregue a tela.',
};
