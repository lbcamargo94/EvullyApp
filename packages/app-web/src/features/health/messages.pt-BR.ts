import type { HealthResultFlag } from '@evully/contracts';

const fullDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

export const formatExamDate = (date: string) => fullDate.format(new Date(`${date}T12:00:00`));
export const formatValue = (value: number) => number.format(value);

/** The laboratory range as printed: "30 – 400", "≥ 30", "≤ 400" or its own text. */
export function formatReference(r: {
  referenceMin: number | null;
  referenceMax: number | null;
  referenceText: string | null;
}): string | null {
  const { referenceMin: min, referenceMax: max } = r;
  if (min !== null && max !== null) return `${formatValue(min)} – ${formatValue(max)}`;
  if (min !== null) return `≥ ${formatValue(min)}`;
  if (max !== null) return `≤ ${formatValue(max)}`;
  return r.referenceText;
}

export const healthMessages = {
  title: 'Saúde',
  subtitle: 'Seus exames laboratoriais, como estão no laudo.',
  notice:
    'O Evully organiza os seus exames, mas não diagnostica nem indica tratamento. A faixa de referência é a do seu laboratório. Leve os resultados a quem acompanha você.',
  newExam: 'Novo exame',
  editExam: 'Editar exame',
  collectedOn: 'Data da coleta',
  laboratory: 'Laboratório (opcional)',
  notes: 'Observações (opcional)',
  results: 'Resultados',
  marker: 'Marcador',
  markerPlaceholder: 'Escolha ou digite outro',
  otherMarker: 'Outro (digitar nome)',
  markerName: 'Nome do marcador',
  value: 'Valor',
  unit: 'Unidade',
  referenceMin: 'Referência mínima',
  referenceMax: 'Referência máxima',
  referenceText: 'Referência em texto (opcional)',
  referenceHint: 'Copie a faixa do laudo. Deixe em branco o lado que o laudo não informa.',
  addResult: 'Adicionar resultado',
  removeResult: (n: number) => `Remover resultado ${n}`,
  resultLabel: (n: number) => `Resultado ${n}`,
  save: 'Salvar exame',
  saving: 'Salvando…',
  cancelEdit: 'Cancelar edição',
  saved: 'Exame salvo.',
  history: 'Exames',
  emptyTitle: 'Nenhum exame ainda',
  empty: 'Lance o primeiro exame com os valores e as faixas de referência do laudo.',
  edit: (date: string) => `Editar exame de ${date}`,
  remove: (date: string) => `Excluir exame de ${date}`,
  removeTitle: 'Excluir este exame?',
  removeBody: 'O exame e os resultados dele saem da lista. Um backup feito antes ainda os tem.',
  removeConfirm: 'Excluir',
  cancel: 'Cancelar',
  reference: 'Referência',
  noReference: 'sem referência',
  attentionCount: (n: number) => (n === 1 ? '1 resultado fora da faixa' : `${n} fora da faixa`),
  genericError: 'Não foi possível salvar. Confira os campos e tente de novo.',
  invalidNumber: 'Use números, com vírgula para decimais.',
} as const;

/** Never alarming (README §24.4): out of range is "Atenção", not a verdict. */
export const flagLabels: Record<HealthResultFlag, string | null> = {
  below: 'Atenção: abaixo da referência',
  above: 'Atenção: acima da referência',
  within: 'Dentro da referência',
  unknown: null,
};

export const healthErrorByCode: Record<string, string> = {
  'health.date_in_future': 'A data da coleta não pode ser no futuro.',
  'health.results_required': 'Informe ao menos um resultado.',
  'health.analyte_required': 'Informe o nome do marcador.',
  'health.unit_required': 'Informe a unidade.',
  'health.reference_order': 'A referência mínima não pode ser maior que a máxima.',
  'health.unknown_analyte': 'Marcador desconhecido. Escolha outro ou digite o nome.',
  'health.not_found': 'Este exame não existe mais.',
};
