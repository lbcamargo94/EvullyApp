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
    'pre-restore': 'antes de restaurar',
    'pre-import': 'antes de importar um perfil',
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
  restoreTitle: 'Restaurar backup',
  restoreHint:
    'Substitui os dados de todos os perfis pelos de um backup. Antes, o Evully faz um backup do estado atual.',
  restoreOpen: 'Escolher backup',
  restoreClose: 'Fechar',
  restoreNone: 'Nenhum backup encontrado nas pastas de backup.',
  restoreFolder: { default: 'Pasta padrão', extra: 'Pasta adicional' },
  restoreChoose: 'Restaurar',
  restoreBrowse: 'Procurar outro arquivo…',
  restoreConfirmTitle: 'Restaurar este backup?',
  restoreFrom: (fileName: string, iso: string, version: string) =>
    `${fileName}, de ${dateTime.format(new Date(iso))} (Evully ${version}).`,
  restoreProfiles: (names: string) => `Perfis no backup: ${names}.`,
  restoreNoProfiles: 'O backup não tem perfis.',
  restoreWarning:
    'Os dados atuais de todos os perfis serão substituídos. O Evully faz um backup do estado atual e reinicia para concluir.',
  restoreConfirm: 'Substituir e reiniciar',
  restoreRestarting: 'Reiniciando…',
  restoreCancel: 'Cancelar',
  restoreFailed: 'Não foi possível restaurar este backup.',
  restoreErrors: {
    'backup.restore_invalid': 'Este arquivo não é um backup do Evully.',
    'backup.restore_corrupt': 'O backup está danificado e não pode ser restaurado.',
    'backup.restore_newer':
      'Este backup é de uma versão mais nova do Evully. Atualize o app antes de restaurar.',
    'backup.restore_not_found': 'O backup não foi encontrado. Atualize a lista.',
    'backup.restore_expired': 'Escolha o backup novamente.',
  } as Record<string, string>,
  errorTitle: 'O último backup automático falhou.',
  errorBody: (iso: string) =>
    `Em ${dateTime.format(new Date(iso))}. Faça um backup manual ou confira a pasta adicional.`,
  errorAction: 'Ver backup',
  dismiss: 'Dispensar',

  tabs: {
    tracking: 'Acompanhamento',
    project: 'Projeto',
    nutrition: 'Nutrição',
    workouts: 'Treino',
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

export const exportMessages = {
  title: 'Exportar dados',
  hint: 'Salva uma cópia dos dados deste perfil para guardar ou abrir em outro programa. Os outros perfis não entram.',
  json: 'Exportar JSON',
  jsonHint: 'Arquivo completo com todos os registros do perfil, para guardar ou transferir.',
  csv: 'Exportar CSV',
  csvHint:
    'Planilhas por categoria (pesos, medidas, treinos, alimentação, água, sono, cardio e hábitos) num arquivo zip, no formato do Excel.',
  exporting: 'Exportando…',
  done: (fileName: string) => `Dados exportados: ${fileName}`,
  failed: 'Não foi possível exportar. Tente outra pasta.',
} as const;

export const aboutMessages = {
  versionTitle: 'Versão',
  version: (v: string) => `Evully ${v}`,
  development: 'modo de desenvolvimento',
  healthTitle: 'Aviso de saúde',
  licenseTitle: 'Licença',
  noticesTitle: 'Avisos de terceiros',
  noticesHint: 'O Evully usa bibliotecas de código aberto. Veja as licenças de cada uma.',
  showNotices: 'Mostrar avisos de terceiros',
  unavailable: 'Não foi possível carregar este texto.',
} as const;

export const updateMessages = {
  disabled: 'Atualizações automáticas só funcionam no app instalado.',
  idle: 'O Evully procura versões novas ao abrir o app.',
  checking: 'Procurando atualizações…',
  downloading: (v: string, progress: number) => `Baixando a versão ${v}… ${progress}%`,
  ready: (v: string) => `A versão ${v} está pronta para instalar.`,
  upToDate: 'Você está na versão mais recente.',
  checkedAt: (iso: string) => `verificado em ${dateTime.format(new Date(iso))}`,
  errors: {
    network: 'Não foi possível procurar atualizações. Confira a internet e tente de novo.',
    signature: 'A atualização baixada não passou na verificação de segurança e não será instalada.',
    unknown: 'Não foi possível atualizar agora. Tente de novo mais tarde.',
  },
  progressLabel: 'Download da atualização',
  check: 'Verificar atualizações',
  channel: 'Receber',
  prerelease: 'Pré-versões e versões estáveis',
  stable: 'Somente versões estáveis',
  hint: 'Uma versão já baixada é instalada ao fechar o Evully, ou agora em “Reiniciar e atualizar”. Antes, o Evully faz o backup de fechamento; seus dados em %APPDATA%\\Evully são mantidos.',
  install: 'Reiniciar e atualizar',
  installing: 'Fechando…',
  bannerTitle: (v: string) => `Nova versão ${v} pronta`,
  bannerBody: 'Reinicie agora ou ela será instalada quando você fechar o Evully.',
  later: 'Depois',
} as const;
