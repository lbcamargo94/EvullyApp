const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const settingsMessages = {
  title: 'Configurações',
  backupTitle: 'Backup',
  lastBackup: 'Último backup',
  never: 'Nenhum backup ainda',
  lastBackupValue: (iso: string, kind: string) => `${dateTime.format(new Date(iso))} · ${kind}`,
  kinds: {
    manual: 'manual',
    automatic: 'automático',
    'pre-migration': 'antes de atualização',
    'pre-delete': 'antes de apagar um perfil',
  },
  backupNow: 'Fazer backup agora',
  backingUp: 'Fazendo backup…',
  backupDone: (fileName: string) => `Backup salvo: ${fileName}`,
  backupFailed: 'Não foi possível fazer o backup. Tente outra pasta.',
  automatic: 'Backup automático ao fechar',
  automaticHint: 'Uma vez por dia, ao fechar o Evully. Mantém as últimas 10 cópias.',
  defaultFolder: (dir: string) => `Cópias em ${dir}`,
  extraFolder: 'Pasta adicional',
  extraFolderHint:
    'Ex.: uma pasta do OneDrive, para ter uma cópia fora deste computador. Não coloque o banco do Evully em pastas sincronizadas: use-as só para backup.',
  noExtraFolder: 'Nenhuma pasta adicional',
  chooseFolder: 'Escolher pasta',
  changeFolder: 'Trocar pasta',
  removeFolder: 'Remover',
  restoreHint: 'Para restaurar um backup, veja o passo a passo em Configurações › Sobre.',
  errorTitle: 'O último backup automático falhou.',
  errorBody: (iso: string) =>
    `Em ${dateTime.format(new Date(iso))}. Faça um backup manual ou confira a pasta adicional.`,
  errorAction: 'Ver backup',
  dismiss: 'Dispensar',

  tabs: {
    tracking: 'Acompanhamento',
    project: 'Projeto',
    profile: 'Perfil',
    general: 'Geral e backup',
    about: 'Sobre',
  },
  saved: 'Salvo.',
  genericError: 'Não foi possível salvar. Tente novamente.',
  cancel: 'Cancelar',
} as const;

export const trackingSettingsMessages = {
  weightTitle: 'Peso no painel',
  weightHint: 'Vale a partir de hoje. O histórico de configurações é mantido.',
  measuresTitle: 'Medidas acompanhadas',
  measuresHint:
    'Marque as medidas que quer registrar e ajuste a ordem. Medidas desmarcadas saem do formulário, mas o histórico continua guardado.',
  tracked: 'Acompanhando',
  available: 'Disponíveis',
  moveUp: (name: string) => `Subir ${name}`,
  moveDown: (name: string) => `Descer ${name}`,
  saveMeasures: 'Salvar medidas',
  pickOne: 'Escolha pelo menos uma medida.',
  tagsTitle: 'Etiquetas de contexto',
  tagsHint: 'Usadas para marcar pesagens. Remover uma etiqueta não apaga pesagens.',
  noTags: 'Nenhuma etiqueta.',
  rename: (name: string) => `Renomear ${name}`,
  remove: (name: string) => `Remover ${name}`,
  tagName: 'Nome da etiqueta',
  save: 'Salvar',
  removeTagTitle: 'Remover etiqueta?',
  removeTagBody: (name: string) =>
    `“${name}” deixa de aparecer nas pesagens e no formulário. As pesagens continuam salvas.`,
  removeTagConfirm: 'Remover etiqueta',
  redoTitle: 'Questionário de acompanhamento',
  redoHint:
    'Refaça as perguntas para receber uma nova sugestão de medidas e de exibição do peso. Seu projeto ativo é mantido.',
  redo: 'Refazer questionário',
} as const;

export const projectSettingsMessages = {
  activeTitle: 'Projeto ativo',
  newTitle: 'Novo projeto',
  newHint: 'Você não tem um projeto ativo. Crie um para o painel mostrar em que dia você está.',
  objective: 'Objetivo',
  save: 'Salvar alterações',
  create: 'Criar projeto',
  saving: 'Salvando…',
  complete: 'Concluir projeto',
  completeTitle: 'Concluir este projeto?',
  completeBody: (name: string) =>
    `“${name}” vai para os projetos anteriores. Seus registros continuam salvos e você poderá criar um novo projeto.`,
  completedTitle: (name: string) => `“${name}” foi concluído`,
  completedBody:
    'Quer revisar o que acompanhar daqui em diante? Refaça o questionário para receber uma nova sugestão. Depois, crie o próximo projeto aqui.',
  redo: 'Refazer questionário',
  pastTitle: 'Projetos anteriores',
  noPast: 'Nenhum projeto concluído ainda.',
  period: (start: string, end: string) => `${start} a ${end}`,
  status: { active: 'Ativo', completed: 'Concluído', archived: 'Arquivado' },
} as const;

/** Error codes that are not tied to a form field. */
export const settingsErrorByCode: Record<string, string> = {
  'project.not_found': 'Projeto não encontrado. Recarregue a tela.',
  'project.not_active': 'Este projeto já foi concluído.',
  'tag.not_found': 'Etiqueta não encontrada. Recarregue a tela.',
  'measurement.unknown_type': 'Medida desconhecida. Recarregue a tela.',
  'profile.not_found': 'Perfil não encontrado. Recarregue a tela.',
  'profile.name_mismatch': 'O nome digitado não confere.',
  'backup.failed': 'Não foi possível fazer o backup. Nada foi apagado.',
};

export const generalSettingsMessages = {
  themeTitle: 'Tema',
  themes: {
    system: { title: 'Igual ao Windows', description: 'Segue o tema claro ou escuro do sistema.' },
    light: { title: 'Claro', description: 'Fundo claro sempre.' },
    dark: { title: 'Escuro', description: 'Fundo escuro sempre.' },
  },
  inactivityTitle: 'Voltar à seleção de perfil',
  inactivityHint:
    'Depois de um tempo sem uso, o Evully volta para a tela de perfis, para ninguém ver os dados de outra pessoa.',
  inactivity: (minutes: number) => (minutes === 0 ? 'Nunca' : `Após ${minutes} minutos`),
} as const;

export const profileSettingsMessages = {
  currentTitle: 'Este perfil',
  currentHint: (name: string) =>
    `Você está usando o perfil ${name}. Arquivar tira o perfil da tela de seleção, mas guarda todos os dados.`,
  editData: 'Editar dados do perfil',
  archive: 'Arquivar este perfil',
  archiveTitle: 'Arquivar este perfil?',
  archiveBody: (name: string) =>
    `“${name}” sai da tela de seleção. Nada é apagado e você pode restaurar o perfil aqui em Configurações › Perfil.`,
  archivedTitle: 'Perfis arquivados',
  noArchived: 'Nenhum perfil arquivado.',
  archivedOn: (date: string) => `Arquivado em ${date}`,
  restore: (name: string) => `Restaurar ${name}`,
  restoreLabel: 'Restaurar',
  restored: (name: string) => `${name} voltou para a tela de seleção.`,
  deleteLabel: 'Apagar definitivamente',
  delete: (name: string) => `Apagar ${name} definitivamente`,
  deleteTitle: 'Apagar definitivamente?',
  deleteBody: (name: string) =>
    `Todos os dados de “${name}” (pesos, medidas, projetos e configurações) serão apagados deste computador. Antes, o Evully faz um backup automático na pasta de backups.`,
  deleteTypeName: (name: string) => `Digite “${name}” para confirmar`,
  deleteConfirm: 'Apagar definitivamente',
  deleted: (name: string) => `${name} foi apagado. O backup foi salvo antes.`,
  deleting: 'Fazendo backup e apagando…',
} as const;

export const aboutMessages = {
  versionTitle: 'Versão',
  version: (v: string) => `Evully ${v}`,
  development: 'modo de desenvolvimento',
  healthTitle: 'Aviso de saúde',
  restoreTitle: 'Como restaurar um backup',
  restoreSteps: [
    'Feche o Evully.',
    'Abra a pasta %APPDATA%\\Evully no Explorador de Arquivos.',
    'Renomeie o arquivo evully.db atual (ex.: evully-antigo.db) para guardá-lo.',
    'Extraia o arquivo evully.db do backup (.zip) e coloque-o nessa pasta.',
    'Abra o Evully novamente.',
  ],
  restoreNote:
    'A restauração pelo próprio app chega com a transferência de perfil (V0.7). Os backups ficam em %APPDATA%\\Evully\\backups.',
  licenseTitle: 'Licença',
  noticesTitle: 'Avisos de terceiros',
  noticesHint: 'O Evully usa bibliotecas de código aberto. Veja as licenças de cada uma.',
  showNotices: 'Mostrar avisos de terceiros',
  unavailable: 'Não foi possível carregar este texto.',
} as const;
