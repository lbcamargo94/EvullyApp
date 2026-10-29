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
    'Ainda não há registros para mostrar. Registre peso, medidas, dieta ou sono e os gráficos aparecem aqui.',
  emptyPeriod: 'Sem registros neste período.',
  chartAlt: (title: string, points: number) =>
    `Gráfico de ${title.toLowerCase()}: ${points} ${points === 1 ? 'ponto' : 'pontos'} no período.`,
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
} as const;
