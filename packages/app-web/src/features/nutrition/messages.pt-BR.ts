import type { FoodUnit } from '@evully/contracts';

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const formatNumber = (value: number) => number.format(value);

export const unitLabels: Record<FoodUnit, string> = { g: 'g', ml: 'ml', portion: 'porção' };

export const foodMessages = {
  title: 'Alimentos',
  subtitle:
    'Catálogo da casa: os alimentos valem para todos os perfis. Copie os valores do rótulo ou da tabela que você usa.',
  formTitle: 'Novo alimento',
  editTitle: 'Editar alimento',
  name: 'Nome',
  namePlaceholder: 'Ex.: Arroz branco cozido',
  brand: 'Marca',
  optional: 'opcional',
  per: 'Valores para',
  amount: 'Quantidade',
  unit: 'Unidade',
  calories: 'Calorias (kcal)',
  protein: 'Proteína (g)',
  carbohydrate: 'Carboidratos (g)',
  fat: 'Gorduras (g)',
  fiber: 'Fibras (g)',
  sodium: 'Sódio (mg)',
  source: 'Fonte',
  sourcePlaceholder: 'Ex.: rótulo, TACO',
  save: 'Salvar alimento',
  saveEdit: 'Salvar alterações',
  saving: 'Salvando…',
  cancel: 'Cancelar',
  saved: (name: string) => `${name} salvo.`,
  invalidNumber: (field: string) => `Confira o valor de ${field.toLowerCase()}.`,
  genericError: 'Não foi possível salvar. Tente novamente.',
  listTitle: 'Catálogo',
  search: 'Buscar alimento',
  searchPlaceholder: 'Buscar por nome ou marca',
  empty: 'Nenhum alimento cadastrado ainda.',
  noResults: 'Nenhum alimento encontrado.',
  count: (n: number) => (n === 1 ? '1 alimento' : `${n} alimentos`),
  summary: (amount: string, unit: string, kcal: string, p: string, c: string, f: string) =>
    `${amount} ${unit}: ${kcal} kcal · P ${p} g · C ${c} g · G ${f} g`,
  edit: (name: string) => `Editar ${name}`,
  remove: (name: string) => `Excluir ${name}`,
  removeTitle: 'Excluir alimento?',
  removeBody: (name: string) =>
    `“${name}” sai do catálogo de todos os perfis. Registros já feitos não mudam.`,
  removeConfirm: 'Excluir',
} as const;

export const foodErrorByCode: Record<string, string> = {
  'food.name_required': 'Informe o nome do alimento.',
  'food.name_too_long': 'Use até 80 caracteres no nome.',
  'food.brand_too_long': 'Use até 60 caracteres na marca.',
  'food.source_too_long': 'Use até 120 caracteres na fonte.',
  'food.amount_out_of_range': 'A quantidade precisa ser maior que zero e até 5.000.',
  'food.calories_out_of_range': 'Confira as calorias (de 0 a 9.000 kcal).',
  'food.nutrient_out_of_range':
    'Confira os nutrientes: em gramas, nenhum pode passar da quantidade informada.',
  'food.macros_exceed_amount':
    'Proteína, carboidratos e gorduras somam mais que a quantidade informada.',
  'food.duplicate': 'Já existe um alimento com esse nome e marca.',
  'food.not_found': 'Alimento não encontrado. Recarregue a tela.',
};
