const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** `-0.62` → `"−0,6 kg/sem."`; the sign is part of the number, not a judgment. */
export const formatRate = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${oneDecimal.format(Math.abs(value))} kg/sem.`;
export const formatWhole = (value: number) => whole.format(value);

export const statsMessages = {
  title: 'Progresso',
  periodLabel: 'Período',
  periods: { days30: '30 dias', days90: '90 dias', project: 'Projeto', all: 'Tudo' },
  emptyAll:
    'Ainda não há registros para mostrar. Registre peso, medidas, refeições, sono, treino, cardio ou passos e os gráficos aparecem aqui.',
  emptyPeriod: 'Sem registros neste período.',
  chartAlt: (title: string, points: number, values: string[]) =>
    `Gráfico de ${title.toLowerCase()}: ${points} ${points === 1 ? 'ponto' : 'pontos'} no período.${values.map((v) => ` ${v}.`).join('')}`,
  chartSeries: (name: string, first: string, last: string) =>
    first === last ? `${name}: ${first}` : `${name}: de ${first} a ${last}`,
  weekOf: (date: string) => `Semana de ${date}`,
  weightTitle: 'Peso',
  weightDaily: 'Peso do dia',
  weightTrend: 'Média móvel (7 dias)',
  weeklyTitle: 'Média semanal do peso',
  weeklyAverage: 'Média da semana',
  rateTitle: 'Velocidade de mudança',
  rateHint: 'Diferença entre as médias de semanas seguidas.',
  rate: 'Variação por semana',
  measurementsTitle: 'Medidas',
  measurementLabel: 'Medida',
  caloriesTitle: 'Calorias consumidas',
  calories: 'Consumido',
  proteinTitle: 'Proteína consumida',
  protein: 'Consumido',
  target: 'Meta',
  nutritionHint: 'Só alimentos marcados como consumidos.',
  sleepTitle: 'Sono',
  sleep: 'Duração da noite',
  volumeTitle: 'Volume de treino',
  volumeHint: 'Carga × repetições das séries concluídas, por semana.',
  volume: 'Volume da semana',
  frequencyTitle: 'Frequência de treino',
  frequency: 'Treinos finalizados',
  workouts: (count: number) => `${count} ${count === 1 ? 'treino' : 'treinos'}`,
  loadTitle: 'Carga por exercício',
  loadHint: 'Maior carga de cada treino.',
  exerciseLabel: 'Exercício',
  cardioTitle: 'Cardio',
  cardio: 'Minutos da semana',
  stepsTitle: 'Passos',
  steps: 'Passos do dia',
  stepsUnit: 'passos',
} as const;

export const comparisonMessages = {
  title: 'Comparar períodos',
  windowLabel: 'Tamanho do período',
  window: (days: number) => `${days} dias`,
  indicator: 'Indicador',
  current: (days: number) => `Últimos ${days} dias`,
  previous: (days: number) => `${days} dias anteriores`,
  weighedDays: 'Dias com pesagem',
  daysOf: (count: number, days: number) => `${count} de ${days}`,
  averageWeight: 'Peso médio',
  trendWeight: 'Média móvel no fim',
  trendChange: 'Variação da média móvel',
  ratePerWeek: 'Ritmo',
  perWeek: ' por semana',
  missingLabel: 'Sem registros suficientes no período',
  workouts: 'Treinos',
  adherenceLabel: 'Aderência ao plano',
  adherence: (done: number, planned: number) =>
    `${done} de ${planned} ${planned === 1 ? 'dia previsto' : 'dias previstos'}`,
  sets: 'Séries concluídas',
  volume: 'Volume',
  trainingTitle: (days: number) => `Treino nos últimos ${days} dias`,
  recordsTitle: 'Recordes',
  recordsEmpty: 'Nenhum recorde neste período.',
  recordValue: (weightKg: number, repetitions: number | null) =>
    `${weightKg.toLocaleString('pt-BR')} kg${repetitions === null ? '' : ` × ${repetitions}`}`,
  recordKind: { load: 'Carga', reps: 'Repetições' },
  recordBeforeLoad: (kg: number) => `antes: ${kg.toLocaleString('pt-BR')} kg`,
  recordBeforeReps: (reps: number) =>
    `antes: ${reps} ${reps === 1 ? 'repetição' : 'repetições'} com essa carga`,
  groupsTitle: 'Por grupo muscular',
  groupsEmpty: 'Nenhuma série concluída neste período.',
  group: 'Grupo',
  setsBefore: 'Séries no período anterior',
  trainingMethod:
    'Só séries concluídas e valores registrados, sem 1RM estimado. Cada exercício conta para o seu grupo principal. Recorde: carga maior que todas as anteriores do exercício, ou mais repetições com uma carga já usada. Aderência: treinos finalizados contra os dias da semana dos planos ativos, desde a criação de cada plano. Cálculo v1.',
  method:
    '— = sem registros suficientes no período. Peso médio e média móvel (7 dias) precisam de pesagem em pelo menos 3 dias. Medidas: último valor do período e a diferença para o último valor antes dele. Cálculo v1, feito na hora a partir dos seus registros.',
} as const;
