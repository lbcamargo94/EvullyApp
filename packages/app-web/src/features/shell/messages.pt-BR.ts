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
  homeBody:
    'Seu perfil está pronto. Peso, medidas e o painel de acompanhamento chegam nas próximas etapas da V0.1.',
} as const;
