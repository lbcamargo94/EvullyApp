const weekday = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

export const formatWeekday = (date: string) => weekday.format(new Date(`${date}T12:00:00`));
export const formatDayMonth = (date: string) => dayMonth.format(new Date(`${date}T12:00:00`));
/** 474 → "7h54". */
export const formatDuration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;

/** Minutes after midnight → "23:40". */
export const formatClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const qualityLabels: Record<number, string> = {
  1: 'Péssima',
  2: 'Ruim',
  3: 'Regular',
  4: 'Boa',
  5: 'Ótima',
};

export const sleepMessages = {
  title: 'Sono',
  formTitle: 'Registrar noite',
  editTitle: 'Editar noite',
  wakeDate: 'Acordou no dia',
  bedTime: 'Deitou',
  sleepTime: 'Dormiu',
  wakeTime: 'Acordou',
  total: 'Total',
  quality: 'Qualidade',
  noQuality: 'Não informar',
  notes: 'Notas',
  optional: 'opcional',
  sleepTimeHint: 'Sem "Dormiu", o total conta a partir de "Deitou".',
  save: 'Registrar',
  saveEdit: 'Salvar alterações',
  saving: 'Salvando…',
  cancel: 'Cancelar',
  saved: 'Noite registrada.',
  required: 'Informe os horários de deitar e de acordar.',
  genericError: 'Não foi possível salvar. Tente novamente.',
  duplicate: (date: string) => `Já existe uma noite em ${date}.`,
  editExisting: 'Editar essa noite',
  history: 'Histórico',
  empty: 'Nenhuma noite registrada ainda.',
  span: (from: string, to: string) => `${from} → ${to}`,
  edit: (date: string) => `Editar a noite de ${date}`,
  remove: (date: string) => `Excluir a noite de ${date}`,
  removeTitle: 'Excluir esta noite?',
  removeBody: 'O registro sai do histórico.',
  removeConfirm: 'Excluir',
  indicators: 'Indicadores',
  average7: 'Média 7 dias',
  average30: 'Média 30 dias',
  meanBedtime: 'Dorme, em média',
  meanWakeTime: 'Acorda, em média',
  consistency: 'Consistência',
  consistencyHint: '30 dias',
  deviation: (minutes: number) => `±${minutes} min`,
  nights: (n: number) => (n === 1 ? '1 noite' : `${n} noites`),
} as const;

export const sleepErrorByCode: Record<string, string> = {
  'sleep.date_in_future': 'A data não pode ser futura.',
  'sleep.time_in_future': 'O horário de acordar não pode ser futuro.',
  'sleep.order': 'Confira os horários: deitou, dormiu e acordou, nessa ordem.',
  'sleep.too_long': 'Use no máximo 20 horas entre deitar e acordar.',
  'sleep.quality_out_of_range': 'Escolha uma qualidade de 1 a 5.',
  'sleep.notes_too_long': 'Use até 280 caracteres nas notas.',
  'sleep.invalid_time': 'Confira os horários.',
  'sleep.not_found': 'Registro não encontrado. Recarregue a tela.',
};
