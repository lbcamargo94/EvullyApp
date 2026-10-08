export const shellMessages = {
  mainMenu: 'Menu principal',
  dashboard: 'Dashboard',
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
  homeTitle: (name: string) => `Olá, ${name}`,
  homeBody: 'O registro de peso e medidas e o painel completo chegam nas próximas etapas da V0.1.',
  noProject: 'Sem projeto ativo. Você poderá criar um nas Configurações.',
  trackedTitle: 'Você acompanha',
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
} as const;
