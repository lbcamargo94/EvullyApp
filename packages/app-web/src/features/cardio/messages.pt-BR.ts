import type { CardioActivity, CardioIntensity } from '@evully/contracts';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const weekday = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

export const formatKm = (km: number) => `${number.format(km)} km`;
export const formatDayMonth = (date: string) => dayMonth.format(new Date(`${date}T12:00:00`));
export const formatWeekday = (date: string) => weekday.format(new Date(`${date}T12:00:00`));

export const activityLabels: Record<CardioActivity, string> = {
  walking: 'Caminhada',
  cycling: 'Bicicleta',
  running: 'Corrida',
  elliptical: 'Elíptico',
  custom: 'Outra',
};

export const intensityLabels: Record<CardioIntensity, string> = {
  light: 'Leve',
  moderate: 'Moderada',
  vigorous: 'Intensa',
};

export const cardioMessages = {
  title: 'Cardio',
  formTitle: 'Registrar cardio',
  editTitle: 'Editar cardio',
  activity: 'Atividade',
  activityName: 'Nome da atividade',
  activityNamePlaceholder: 'Ex.: Remo',
  date: 'Data',
  time: 'Início',
  duration: 'Duração (min)',
  distance: 'Distância (km)',
  steps: 'Passos da sessão',
  stepsHint: 'Só desta sessão; o total do dia fica no hábito Passos.',
  intensity: 'Intensidade',
  noIntensity: 'Não informar',
  heartRate: 'FC média (bpm)',
  notes: 'Notas',
  optional: 'opcional',
  more: 'Mais detalhes',
  save: 'Registrar',
  saveEdit: 'Salvar alterações',
  saving: 'Salvando…',
  cancel: 'Cancelar',
  saved: 'Cardio registrado.',
  invalidNumber: (field: string) => `Confira o valor de ${field.toLowerCase()}.`,
  genericError: 'Não foi possível salvar. Tente novamente.',
  thisWeek: 'Esta semana',
  weekOf: (start: string, end: string) => `Semana de ${start} a ${end}`,
  sessions: (n: number) => (n === 1 ? '1 sessão' : `${n} sessões`),
  minutes: (n: number) => `${n} min`,
  empty: 'Nenhum cardio registrado ainda.',
  history: 'Histórico',
  edit: (label: string) => `Editar ${label}`,
  remove: (label: string) => `Excluir ${label}`,
  removeTitle: 'Excluir este cardio?',
  removeBody: 'O registro sai do histórico e dos totais da semana.',
  removeConfirm: 'Excluir',
  targetSet: 'Definir meta',
  targetEdit: 'Alterar meta',
  targetSessions: 'Sessões por semana',
  targetMinutes: 'Minutos por semana',
  targetHint: 'Você define a meta; ela vale a partir de hoje. Deixe os dois vazios para remover.',
  targetSave: 'Salvar meta',
  targetInvalid: 'Use números inteiros.',
  ofTarget: (value: number, goal: number) => `${value} / ${goal}`,
} as const;

export const cardioErrorByCode: Record<string, string> = {
  'cardio.date_in_future': 'A data não pode ser futura.',
  'cardio.duration_out_of_range': 'Use uma duração inteira de 1 a 600 minutos.',
  'cardio.distance_out_of_range': 'Use uma distância de 0 a 300 km.',
  'cardio.steps_out_of_range': 'Use até 100.000 passos.',
  'cardio.heart_rate_out_of_range': 'Use uma FC média de 30 a 250 bpm.',
  'cardio.activity_name_required': 'Dê um nome à atividade.',
  'cardio.activity_name_too_long': 'Use até 40 caracteres no nome.',
  'cardio.notes_too_long': 'Use até 280 caracteres nas notas.',
  'cardio.not_found': 'Registro não encontrado. Recarregue a tela.',
  'cardio_target.out_of_range': 'Use de 1 a 14 sessões e de 1 a 3.000 minutos por semana.',
};
