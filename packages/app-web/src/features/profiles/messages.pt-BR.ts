export const profileMessages = {
  selectTitle: 'Quem está usando?',
  selectSubtitle: 'Escolha seu perfil para continuar.',
  addProfile: 'Adicionar perfil',
  localDataNote: 'Seus dados ficam guardados neste computador.',
  loadError: 'Não foi possível carregar os perfis.',
  createTitle: 'Vamos criar seu perfil',
  createSubtitle: 'Só o nome é obrigatório. O resto ajuda o Evully a sugerir o acompanhamento.',
  editTitle: 'Editar perfil',
  name: 'Nome',
  birthDate: 'Nascimento',
  sex: 'Sexo',
  sexOptions: { '': 'Prefiro não informar', male: 'Masculino', female: 'Feminino' },
  height: 'Altura (cm)',
  optional: 'opcional',
  create: 'Criar perfil',
  save: 'Salvar',
  cancel: 'Cancelar',
  saving: 'Salvando…',
  genericError: 'Não foi possível salvar. Tente novamente.',
} as const;

type Field = 'name' | 'birthDate' | 'heightCm';

/** Domain error codes (packages/domain) → field and pt-BR message. */
export const profileErrorByCode: Record<string, { field: Field; message: string }> = {
  'profile.name_required': { field: 'name', message: 'Informe o nome.' },
  'profile.name_too_long': { field: 'name', message: 'Use até 60 caracteres.' },
  'profile.birth_date_in_future': { field: 'birthDate', message: 'A data não pode ser futura.' },
  'profile.birth_date_too_old': { field: 'birthDate', message: 'Confira o ano de nascimento.' },
  'date.invalid': { field: 'birthDate', message: 'Data inválida.' },
  'date.invalid_format': { field: 'birthDate', message: 'Data inválida.' },
  'profile.height_out_of_range': {
    field: 'heightCm',
    message: 'Informe a altura em centímetros, entre 50 e 272.',
  },
};

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** Profile transfer between computers (README §14.4). */
export const transferMessages = {
  title: 'Transferir perfil',
  hint: 'Para usar este perfil em outro computador: exporte aqui e importe o arquivo no Evully do outro computador.',
  exportProfile: 'Exportar perfil',
  exporting: 'Exportando…',
  exported: (fileName: string) => `Perfil exportado: ${fileName}`,
  exportFailed: 'Não foi possível exportar. Tente outra pasta.',
  importProfile: 'Importar perfil',
  otherComputer: 'Já usa o Evully em outro computador?',
  importTitle: 'Importar este perfil?',
  replaceTitle: 'Substituir o perfil deste computador?',
  from: (name: string, iso: string, version: string) =>
    `${name}, exportado em ${dateTime.format(new Date(iso))} (Evully ${version}).`,
  counts: (c: {
    weights: number;
    measurements: number;
    foodLogs: number;
    workouts: number;
    cardio: number;
    sleep: number;
    habitLogs: number;
  }) =>
    `Pesagens: ${c.weights} · Medições: ${c.measurements} · Alimentos registrados: ${c.foodLogs} · Treinos: ${c.workouts} · Cardio: ${c.cardio} · Noites de sono: ${c.sleep} · Registros de hábitos: ${c.habitLogs}.`,
  willCreate: 'O perfil será criado neste computador.',
  replaceWarning: (name: string, archived: boolean) =>
    `Este computador já tem o perfil “${name}”${archived ? ' (arquivado)' : ''}. Os dados dele serão substituídos pelos do arquivo. Antes, o Evully faz um backup.`,
  confirmImport: 'Importar perfil',
  replace: 'Substituir perfil',
  importing: 'Importando…',
  cancel: 'Cancelar',
  imported: (name: string) => `${name} foi importado.`,
  failed: 'Não foi possível importar este arquivo.',
  errors: {
    'transfer.invalid': 'Este arquivo não é um perfil exportado pelo Evully.',
    'transfer.corrupt': 'O arquivo está danificado e não pode ser importado.',
    'transfer.newer':
      'Este arquivo é de uma versão mais nova do Evully. Atualize o app antes de importar.',
    'transfer.failed': 'Não foi possível importar. Nada foi alterado neste computador.',
    'transfer.expired': 'Escolha o arquivo novamente.',
    'backup.failed': 'Não foi possível fazer o backup. Nada foi alterado.',
  } as Record<string, string>,
} as const;
