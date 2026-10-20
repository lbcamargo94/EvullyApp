const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const settingsMessages = {
  title: 'Configurações',
  backupTitle: 'Backup',
  lastBackup: 'Último backup',
  never: 'Nenhum backup ainda',
  lastBackupValue: (iso: string, kind: string) => `${dateTime.format(new Date(iso))} · ${kind}`,
  kinds: { manual: 'manual', automatic: 'automático', 'pre-migration': 'antes de atualização' },
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
  restoreHint:
    'Para restaurar um backup (até a versão 0.7): feche o Evully, extraia o arquivo evully.db do zip e substitua o de %APPDATA%\\Evully, guardando o arquivo atual.',
  errorTitle: 'O último backup automático falhou.',
  errorBody: (iso: string) =>
    `Em ${dateTime.format(new Date(iso))}. Faça um backup manual ou confira a pasta adicional.`,
  errorAction: 'Ver backup',
  dismiss: 'Dispensar',

  tabs: { tracking: 'Acompanhamento', project: 'Projeto', general: 'Geral e backup' },
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
};
