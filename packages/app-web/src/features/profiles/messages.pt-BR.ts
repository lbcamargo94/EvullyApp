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
  birthDate: 'Data de nascimento',
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
