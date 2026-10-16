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
} as const;
