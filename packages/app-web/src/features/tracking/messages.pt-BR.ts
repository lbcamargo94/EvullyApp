import type { FocusArea, Objective, WeightDisplay } from '@evully/contracts';

export const trackingMessages = {
  progress: 'Progresso do questionário',
  step: (n: number, total: number) => `Passo ${n} de ${total}`,
  summaryStep: 'Resumo',
  skipAll: 'Pular e configurar depois',
  back: 'Voltar',
  skip: 'Pular',
  skipProject: 'Pular projeto',
  next: 'Continuar',
  toSummary: 'Ver resumo',
  adjust: 'Ajustar',
  accept: 'Aceitar e começar',
  saving: 'Salvando…',
  genericError: 'Não foi possível salvar. Tente novamente.',

  objectiveTitle: 'Qual é o seu objetivo agora?',
  projectTitle: 'Dê um nome e um prazo ao seu projeto',
  projectSubtitle: 'O painel mostra em que dia do projeto você está.',
  projectName: 'Nome do projeto',
  projectNamePlaceholder: 'Ex.: Shape de Praia',
  startDate: 'Início',
  targetDate: 'Prazo',
  projectDays: (days: number) => `${days} dias de projeto.`,
  focusTitle: 'Quais áreas do corpo você quer acompanhar?',
  focusSubtitle: 'Escolha quantas quiser. A ordem de escolha define a ordem no painel.',
  weightTitle: 'Como você prefere ver o seu peso?',
  weightSubtitle: 'O peso varia de um dia para o outro. A tendência mostra a direção real.',
  interestsTitle: 'Recursos em breve',
  interestsSubtitle:
    'Ainda não existem. Sua resposta ajuda a decidir o que vem primeiro, e avisamos quando chegarem.',
  suggestionTitle: 'Tem algo que você gostaria de acompanhar e não encontrou?',
  suggestionLabel: 'Sua sugestão',
  suggestionPlaceholder: 'Ex.: acompanhar quantas horas fico em pé',
  optional: 'opcional',
  summaryTitle: 'Seu Evully ficará assim',
  summaryObjective: 'Objetivo',
  summaryProject: 'Projeto',
  summaryMeasures: 'Medidas',
  summaryWeight: 'Peso no painel',
  summaryNoProject: 'Sem projeto por enquanto',
  summaryUntil: (name: string, date: string) => `${name} · até ${date}`,
  summaryFooter: 'Você pode mudar tudo depois nas Configurações.',
} as const;

export const objectiveLabels: Record<Objective, { title: string; description: string }> = {
  fat_loss: { title: 'Perder gordura', description: 'Reduzir medidas e peso' },
  muscle_gain: { title: 'Ganhar massa', description: 'Aumentar massa muscular' },
  recomposition: { title: 'Recomposição', description: 'Perder gordura e ganhar massa' },
  maintenance: { title: 'Manter / saúde', description: 'Manter o que já conquistou' },
};

export const focusAreaLabels: Record<FocusArea, string> = {
  waist: 'Barriga/cintura',
  hips: 'Quadril/glúteos',
  arms: 'Braços',
  legs: 'Pernas',
  chest: 'Tórax/costas',
};

export const weightDisplayLabels: Record<WeightDisplay, { title: string; description: string }> = {
  trend: {
    title: 'Tendência (recomendado)',
    description: 'Média dos últimos 7 dias em destaque; peso do dia em segundo plano.',
  },
  daily: {
    title: 'Peso do dia',
    description: 'Peso de hoje em destaque; tendência em segundo plano.',
  },
  hidden: {
    title: 'Prefiro não ver o peso no painel',
    description: 'O painel destaca suas medidas. A tela de peso continua disponível.',
  },
};

export const measurementNames: Record<string, string> = {
  waist: 'Cintura',
  abdomen: 'Abdômen',
  hips: 'Quadril',
  chest: 'Tórax/busto',
  right_arm: 'Braço relaxado D',
  left_arm: 'Braço relaxado E',
  right_biceps: 'Bíceps contraído D',
  left_biceps: 'Bíceps contraído E',
  right_thigh: 'Coxa D',
  left_thigh: 'Coxa E',
  right_calf: 'Panturrilha D',
  left_calf: 'Panturrilha E',
  neck: 'Pescoço',
};

export const interestQuestions = {
  menstrualCycle: {
    question: 'Gostaria de acompanhar o ciclo menstrual para entender variações de peso?',
    options: { yes: 'Sim', no: 'Não', later: 'Talvez depois' },
  },
  progressPhotos: {
    question: 'Gostaria de registrar fotos de progresso?',
    options: { yes: 'Sim', no: 'Não', later: 'Talvez depois' },
  },
  pin: {
    question: 'Gostaria de proteger seu perfil com um PIN?',
    options: { yes: 'Sim', no: 'Não' },
  },
  weighingDevice: {
    question: 'Onde você prefere registrar o peso?',
    options: { computer: 'Computador', phone: 'Celular', any: 'Tanto faz' },
  },
} as const;

/** Domain error codes for the project step → field and message. */
export const projectErrorByCode: Record<string, { field: 'name' | 'dates'; message: string }> = {
  'project.name_required': { field: 'name', message: 'Informe o nome do projeto.' },
  'project.name_too_long': { field: 'name', message: 'Use até 60 caracteres.' },
  'project.target_before_start': {
    field: 'dates',
    message: 'O prazo precisa ser depois do início.',
  },
  'project.too_long': { field: 'dates', message: 'O projeto pode ter no máximo 5 anos.' },
  'project.active_exists': {
    field: 'dates',
    message: 'Este perfil já tem um projeto ativo. Conclua-o antes de criar outro.',
  },
  'date.invalid': { field: 'dates', message: 'Confira as datas.' },
  'date.invalid_format': { field: 'dates', message: 'Confira as datas.' },
};
