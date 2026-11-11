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
  title: 'Estatísticas',
  periodLabel: 'Período',
  periods: { days30: '30 dias', days90: '90 dias', project: 'Projeto', all: 'Tudo' },
  emptyAll:
    'Ainda não há registros para mostrar. Registre peso, medidas, dieta, sono, treino, cardio ou passos e os gráficos aparecem aqui.',
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
