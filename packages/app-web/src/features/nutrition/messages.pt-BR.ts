import type { FoodUnit, MealType } from '@evully/contracts';

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
  'food.in_use':
    'Este alimento já foi usado em refeições ou favoritas e não pode ser excluído. Você pode editá-lo.',
};

const weekday = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
});

export const mealLabels: Record<Exclude<MealType, 'custom'>, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  pre_workout: 'Pré-treino',
  dinner: 'Jantar',
  supper: 'Ceia',
};

export const dietMessages = {
  title: 'Dieta',
  tabs: { day: 'Dia', favorites: 'Favoritas', foods: 'Alimentos' },
  previousDay: 'Dia anterior',
  nextDay: 'Próximo dia',
  backToToday: 'Voltar para hoje',
  dayLabel: (date: string, today: string, yesterday: string, tomorrow: string) => {
    if (date === today) return 'Hoje';
    if (date === yesterday) return 'Ontem';
    if (date === tomorrow) return 'Amanhã';
    const text = weekday.format(new Date(`${date}T12:00:00`));
    return text.charAt(0).toUpperCase() + text.slice(1);
  },
  planningHint: 'Dia futuro: você pode planejar as refeições e marcá-las como consumidas no dia.',
  totalsTitle: 'Total do dia',
  consumed: 'Consumido',
  planned: 'Planejado',
  kcal: (value: string) => `${value} kcal`,
  macros: (p: string, c: string, f: string) => `P ${p} g · C ${c} g · G ${f} g`,
  protein: 'Proteína',
  carbohydrate: 'Carboidratos',
  fat: 'Gorduras',
  emptyMeal: 'Nenhum alimento.',
  addFood: 'Adicionar alimento',
  searchFood: 'Buscar alimento no catálogo',
  noFoods: 'O catálogo está vazio. Cadastre alimentos na aba Alimentos.',
  noMatch: 'Nenhum alimento encontrado.',
  quantity: (unit: string) => `Quantidade (${unit})`,
  add: 'Adicionar',
  cancel: 'Cancelar',
  markMeal: 'Marcar refeição como consumida',
  unmarkMeal: 'Refeição consumida',
  consumedItem: (name: string) => `${name} consumido`,
  quantityOf: (name: string) => `Quantidade de ${name}`,
  removeItem: (name: string) => `Remover ${name} da refeição`,
  newMeal: 'Adicionar outra refeição',
  newMealName: 'Nome da refeição',
  newMealPlaceholder: 'Ex.: Lanche da tarde',
  createMeal: 'Criar',
  genericError: 'Não foi possível salvar. Tente novamente.',
  mealActions: (meal: string) => `Mais ações: ${meal}`,
  repeatYesterday: 'Repetir de ontem',
  copyTo: 'Copiar para…',
  saveFavorite: 'Salvar como favorita',
  useFavorite: 'Usar favorita…',
  copyTitle: 'Copiar esta refeição para',
  copyDate: 'Dia',
  copyMeal: 'Refeição',
  copySameCustom: (name: string) => `${name} (mesmo nome)`,
  copyConfirm: 'Copiar',
  copied: 'Refeição copiada como planejada.',
  favoriteName: 'Nome da favorita',
  favoriteSave: 'Salvar',
  favoriteSaved: (name: string) => `“${name}” salva nas favoritas.`,
  favoritesEmpty: 'Nenhuma favorita ainda. Monte uma refeição e use “Salvar como favorita”.',
  applyFavorite: (name: string) => `Usar ${name}`,
  kcalApprox: (value: string) => `${value} kcal`,
  plannedHint: 'Os itens entram como planejados; marque como consumido quando comer.',
  removeFavorite: (name: string) => `Excluir favorita ${name}`,
  removeFavoriteTitle: 'Excluir favorita?',
  removeFavoriteBody: (name: string) =>
    `“${name}” sai das favoritas. Refeições já registradas não mudam.`,
  removeFavoriteConfirm: 'Excluir',
  favoritesHint:
    'Favoritas guardam alimentos e quantidades. Ao usar, os valores vêm do catálogo atual.',
} as const;

export const foodLogErrorByCode: Record<string, string> = {
  'food_log.quantity_out_of_range': 'Use uma quantidade maior que zero e até 10.000.',
  'food_log.date_too_far': 'Dá para planejar até 30 dias à frente.',
  'food_log.consume_future': 'Só dá para marcar como consumido hoje ou em dias passados.',
  'food_log.meal_name_required': 'Dê um nome à refeição.',
  'food_log.meal_name_too_long': 'Use até 40 caracteres no nome da refeição.',
  'food_log.not_found': 'Item não encontrado. Recarregue a tela.',
  'food.not_found': 'Alimento não encontrado no catálogo.',
  'food_log.meal_empty': 'Essa refeição não tem alimentos para copiar.',
  'meal_template.name_required': 'Dê um nome à favorita.',
  'meal_template.name_too_long': 'Use até 40 caracteres no nome da favorita.',
  'meal_template.duplicate': 'Já existe uma favorita com esse nome.',
  'meal_template.not_found': 'Favorita não encontrada. Recarregue a tela.',
};
