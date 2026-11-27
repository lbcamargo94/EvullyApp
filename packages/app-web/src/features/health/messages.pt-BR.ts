import type { MarkerLevel, MarkerTrend } from '@evully/app-core';
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

export const healthTabs = { exams: 'Exames', markers: 'Marcadores', compare: 'Comparar' } as const;
export type HealthTab = keyof typeof healthTabs;

export const formatShortDate = (date: string) =>
  `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(2, 4)}`;

/** Signed difference, never colored as good or bad (README §24.4). */
export const formatDifference = (value: number) =>
  value > 0 ? `+${formatValue(value)}` : formatValue(value);

export const markerMessages = {
  title: 'Marcadores',
  list: 'Seus marcadores',
  emptyTitle: 'Nenhum marcador ainda',
  empty: 'Os marcadores aparecem aqui depois do primeiro exame.',
  chartTitle: (name: string) => `Histórico de ${name}`,
  chartAlt: (name: string, count: number, first: string, last: string) =>
    `${name}: ${count} resultados, de ${first} a ${last}.`,
  chartOnlyUnit: (unit: string) => `O gráfico mostra só os resultados em ${unit}.`,
  referenceMin: 'Mínimo da referência',
  referenceMax: 'Máximo da referência',
  about: 'O que é',
  aboutCustom: 'Marcador digitado por você. O Evully não tem uma descrição para ele.',
  historyTable: 'Resultados',
  date: 'Data',
  value: 'Valor',
  reference: 'Referência',
  position: 'Posição',
  questions: 'Perguntas para levar ao profissional',
  questionsHint: 'Sugestões para a consulta. Só quem acompanha você pode avaliar os resultados.',
  last: (value: string, date: string) => `Último: ${value} em ${date}`,
} as const;

export const levelLabels: Record<MarkerLevel, string> = {
  informative: 'Informativo',
  attention: 'Atenção',
  professional: 'Avaliação profissional recomendada',
};

export const levelHints: Record<MarkerLevel, string> = {
  informative: 'O último resultado está dentro da faixa do laboratório, ou o laudo não traz faixa.',
  attention: 'O último resultado está fora da faixa do laboratório.',
  professional: 'Os dois últimos resultados estão fora da faixa do laboratório, do mesmo lado.',
};

export const trendLabels: Record<MarkerTrend, string | null> = {
  up: 'Subiu desde o exame anterior',
  down: 'Desceu desde o exame anterior',
  same: 'Igual ao exame anterior',
  unit_changed: 'Unidades diferentes, sem comparação',
  single: null,
};

/** Fixed questions per situation; no number is computed for the person. */
export function markerQuestions(name: string, level: MarkerLevel, trend: MarkerTrend): string[] {
  const questions: string[] = [];
  if (level === 'professional')
    questions.push(
      `${name} ficou fora da faixa nos dois últimos exames. Vale investigar o motivo?`,
      'Preciso repetir este exame? Em quanto tempo?',
    );
  if (level === 'attention')
    questions.push(
      `${name} veio fora da faixa do laboratório. Este resultado pede algum acompanhamento?`,
    );
  if (level !== 'informative')
    questions.push(
      'Algo da minha rotina (alimentação, treino, sono, medicamentos ou suplementos) pode ter influenciado este resultado?',
    );
  if (trend === 'up' || trend === 'down')
    questions.push(
      `${name} ${trend === 'up' ? 'subiu' : 'desceu'} desde o exame anterior. Essa variação é esperada?`,
    );
  if (trend === 'unit_changed')
    questions.push('Os dois últimos laudos usam unidades diferentes. Como comparar os resultados?');
  questions.push('Com que frequência vale repetir este exame no meu caso?');
  return questions;
}

export const compareMessages = {
  title: 'Comparar exames',
  needTwoTitle: 'Comparação precisa de dois exames',
  needTwo: 'Lance mais um exame para ver os resultados lado a lado.',
  first: 'Exame anterior',
  second: 'Exame mais recente',
  marker: 'Marcador',
  difference: 'Diferença',
  missing: '—',
  noDifference: 'sem comparação',
  hint: 'A diferença aparece só quando os dois resultados usam a mesma unidade.',
  sameExam: 'Escolha dois exames diferentes.',
} as const;

const size = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
/** "820 KB" or "2,4 MB". */
export const formatFileSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${size.format(Math.max(1, Math.round(bytes / 1024)))} KB`
    : `${size.format(bytes / (1024 * 1024))} MB`;

export const documentMessages = {
  label: 'PDF do laudo',
  attach: (date: string) => `Anexar PDF ao exame de ${date}`,
  attachShort: 'Anexar PDF',
  replace: 'Trocar PDF',
  open: 'Abrir',
  saveCopy: 'Salvar cópia',
  remove: 'Remover anexo',
  removeTitle: 'Remover o PDF deste exame?',
  removeBody:
    'O PDF sai do exame; os valores lançados continuam. Um backup feito antes ainda o tem.',
  removeConfirm: 'Remover',
  saved: 'Cópia salva.',
  hint: 'O Evully guarda o PDF como está, sem ler o conteúdo. Até 10 MB.',
} as const;

export const documentErrorByCode: Record<string, string> = {
  'health.document_too_large': 'O PDF passa de 10 MB. Escolha um arquivo menor.',
  'health.document_not_pdf': 'Este arquivo não é um PDF.',
  'health.document_empty': 'O arquivo está vazio.',
  'health.document_not_found': 'Este PDF não existe mais.',
  'health.document_open_failed':
    'Não há um leitor de PDF para abrir o arquivo. Use "Salvar cópia".',
  'health.not_found': 'Este exame não existe mais.',
};
