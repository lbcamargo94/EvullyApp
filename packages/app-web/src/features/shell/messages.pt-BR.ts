const twoDecimals = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const sign = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '');

/** E.g. "−0,62 kg/semana". */
export const formatSignedRate = (value: number) =>
  `${sign(value)}${twoDecimals.format(Math.abs(value))} kg/semana`;
/** E.g. "−1,2 cm". */
export const formatSignedCm = (value: number) =>
  `${sign(value)}${oneDecimal.format(Math.abs(value))} cm`;

export const shellMessages = {
  mainMenu: 'Menu principal',
  dashboard: 'Dashboard',
  weight: 'Peso',
  diet: 'Dieta',
  workouts: 'Treinos',
  cardio: 'Cardio',
  habits: 'Hábitos',
  sleep: 'Sono',
  stats: 'Estatísticas',
  measurements: 'Medidas',
  settings: 'Configurações',
  registerMeasurements: 'Registrar medidas',
  switchProfile: (name: string) => `Trocar de perfil. Perfil atual: ${name}`,
  profilesLabel: 'Perfis',
  otherProfiles: 'Trocar para',
  editProfile: 'Editar perfil',
  allProfiles: 'Ver todos os perfis',
  version: (v: string) => `Versão ${v}`,
  healthTitle: 'Antes de começar',
  healthBody: [
    'O Evully é uma ferramenta de registro e planejamento.',
    'Ele não substitui médico, nutricionista ou educador físico, e não faz diagnósticos nem recomendações médicas.',
    'Seus dados ficam guardados neste computador.',
  ],
  healthAccept: 'Entendi',
  errorTitle: 'Algo deu errado nesta tela',
  errorBody: 'Seus dados estão salvos. Recarregue para continuar de onde parou.',
  errorReload: 'Recarregar',
  homeTitle: (name: string) => `Olá, ${name}`,
  registerWeight: 'Registrar peso',
  noProjectTitle: 'Sem projeto ativo',
  noProjectBody:
    'Um projeto dá nome e prazo ao seu objetivo. O painel mostra em que dia você está e colore a evolução conforme o objetivo.',
  createProject: 'Criar projeto',
  projectEndedHint: 'O prazo terminou. Conclua o projeto para começar um novo quando quiser.',
  completeProject: 'Concluir projeto',
  projectLabel: 'Projeto atual',
  projectKicker: (objective: string) => `Projeto · ${objective}`,
  projectDay: (day: number, total: number, left: number) =>
    left === 0
      ? `Dia ${day} de ${total} · último dia`
      : `Dia ${day} de ${total} · faltam ${left} ${left === 1 ? 'dia' : 'dias'}`,
  projectStartsIn: (days: number) => `Começa em ${days} ${days === 1 ? 'dia' : 'dias'}`,
  projectEnded: 'Prazo encerrado',
  until: (date: string) => `até ${date}`,
  projectProgress: 'Dias do projeto',
  todayTitle: 'Hoje',
  workoutTitle: 'Treino',
  workoutPlan: (plan: string, exercises: number) =>
    `${plan} · ${exercises === 1 ? '1 exercício' : `${exercises} exercícios`}`,
  workoutInProgress: (day: string) => `${day} · em andamento`,
  freeWorkout: 'Treino livre',
  startWorkout: 'Começar treino',
  continueWorkout: 'Continuar treino',
  noWorkoutToday: 'Nenhum treino planejado para hoje.',
  workoutDone: 'Concluído',
  workoutDoneToday: 'Treino concluído hoje.',
  workoutError: 'Não foi possível começar o treino. Tente novamente.',
  calories: 'Calorias',
  protein: 'Proteína',
  water: 'Água',
  habitsTitle: 'Hábitos de hoje',
  openHabits: 'Abrir Hábitos',
  habitsDone: (done: number, total: number) => `${done} de ${total} cumpridos`,
  habitDone: 'cumprido',
  habitPending: 'pendente',
  sleepTitle: 'Sono',
  openSleep: 'Abrir Sono',
  lastNight: (day: string) => `Última noite (${day})`,
  sleepAverage7: 'Média 7 dias',
  cardioTitle: 'Cardio da semana',
  openCardio: 'Abrir Cardio',
  cardioWeek: (sessions: number, minutes: number) =>
    `${sessions === 1 ? '1 sessão' : `${sessions} sessões`} · ${minutes} min`,
  evolutionTitle: 'Últimos 14 dias',
  evolutionHint: 'Números dos seus registros, sem recomendações.',
  evolutionWeight: 'Peso médio',
  evolutionWaist: 'Cintura',
  evolutionWorkouts: 'Treinos',
  evolutionProtein: 'Proteína média',
  evolutionSleep: 'Sono médio',
  evolutionPerformance: 'Performance',
  workoutsDone: (done: number, planned: number | null) =>
    planned === null
      ? done === 1
        ? '1 concluído'
        : `${done} concluídos`
      : `${done}/${planned} concluídos`,
  proteinPerDay: (grams: number) => `${grams} g/dia`,
  performance: { up: 'subindo', stable: 'estável', down: 'caindo' },
} as const;
