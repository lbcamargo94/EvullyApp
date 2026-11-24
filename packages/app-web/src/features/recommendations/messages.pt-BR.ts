import { formatLocalDate } from '@evully/app-core';
import type { RecommendationDto, RecommendationRule } from '@evully/contracts';

const kg = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const date = (d: string) => formatLocalDate(d);
const dayMonth = (d: string) => formatLocalDate(d).slice(0, 5);

/** What a signal says: plain facts from the records, never advice (README §2.6). */
export function signalText(signal: RecommendationDto): { title: string; body: string } {
  switch (signal.ruleId) {
    case 'weight_missing':
      return {
        title: `Sem pesagem há ${signal.evidence.daysSince} dias`,
        body: `Sua última pesagem foi em ${date(signal.evidence.lastDate)}. Com pesagens regulares, a média móvel do peso fica mais fiel.`,
      };
    case 'measurements_missing':
      return {
        title: `Sem medidas há ${signal.evidence.daysSince} dias`,
        body: `Suas últimas medidas são de ${date(signal.evidence.lastDate)}.`,
      };
    case 'double_progression': {
      const e = signal.evidence;
      const unit = e.targetType === 'reps' ? 'repetições' : 'segundos';
      const increase =
        e.incrementKg === null
          ? 'Se quiser, aumente a carga no próximo treino.'
          : `Se quiser, aumente a carga em ${kg.format(e.incrementKg)} kg no próximo treino.`;
      return {
        title: `${e.exerciseName}: critério de progressão atingido`,
        body: `No treino de ${date(e.lastDate)} você concluiu as ${e.sets} séries no topo da faixa (${e.top} ${unit}). ${increase}`,
      };
    }
  }
}

/** The numbers behind a signal, for "Por que estou vendo isso?". */
export function signalWhy(signal: RecommendationDto): string[] {
  const rule = `Regra "${ruleNames[signal.ruleId]}", versão ${signal.ruleVersion}, detectada em ${date(signal.detectedOn)}.`;
  switch (signal.ruleId) {
    case 'weight_missing':
    case 'measurements_missing':
      return [
        `Último registro: ${date(signal.evidence.lastDate)} (${signal.evidence.daysSince} dias).`,
        `Aparece a partir de ${signal.evidence.limitDays} dias sem registro.`,
        rule,
      ];
    case 'double_progression':
      return [
        `Séries concluídas: ${signal.evidence.values.join(', ')}; topo da faixa: ${signal.evidence.top}.`,
        'Aparece quando todas as séries prescritas chegam ao topo da faixa, com o RIR dentro da faixa quando há um.',
        rule,
      ];
  }
}

export const ruleNames: Record<RecommendationRule, string> = {
  weight_missing: 'Pesagem ausente',
  measurements_missing: 'Medidas ausentes',
  double_progression: 'Progressão dupla',
};

export const ruleDescriptions: Record<RecommendationRule, string> = {
  weight_missing: 'Avisa depois de 7 dias sem pesagem.',
  measurements_missing: 'Avisa depois de 21 dias sem medidas, se você acompanha alguma.',
  double_progression:
    'Avisa quando um exercício dos planos ativos atingiu o critério para aumentar a carga.',
};

/** Where the user goes to act on a signal. */
export const signalAction: Record<RecommendationRule, { label: string; to: string }> = {
  weight_missing: { label: 'Registrar peso', to: '/app/weight' },
  measurements_missing: { label: 'Registrar medidas', to: '/app/measurements' },
  double_progression: { label: 'Abrir treinos', to: '/app/workouts' },
};

export const signalsMessages = {
  title: 'Sinais',
  description:
    'Avisos calculados a partir dos seus registros, com regras fixas. Nenhum dado muda sem você.',
  openTitle: 'Abertos',
  emptyTitle: 'Nenhum sinal aberto',
  empty: 'Quando uma regra encontrar algo nos seus registros, ele aparece aqui.',
  historyTitle: 'Histórico',
  historyEmpty: 'Os sinais dispensados, adiados ou resolvidos aparecem aqui.',
  why: 'Por que estou vendo isso?',
  dismiss: 'Dispensar',
  snooze: 'Lembrar em 7 dias',
  dismissed: 'Dispensado. Volta só se continuar valendo daqui a 14 dias.',
  snoozed: 'Adiado por 7 dias.',
  failed: 'Não foi possível salvar. Tente de novo.',
  columnDate: 'Data',
  columnSignal: 'Sinal',
  columnStatus: 'Situação',
  status: (s: RecommendationDto) =>
    ({
      open: 'Aberto',
      snoozed: `Adiado até ${s.snoozedUntil ? dayMonth(s.snoozedUntil) : ''}`,
      dismissed: 'Dispensado',
      accepted: 'Aceito',
      resolved: 'Resolvido',
    })[s.status],
  dayMonth,
  level: { info: 'Informativo', attention: 'Atenção' },
  cardTitle: 'Sinais',
  seeAll: 'Ver todos os sinais',
  more: (n: number) => `e mais ${n} ${n === 1 ? 'sinal' : 'sinais'}`,
  settingsTitle: 'Sinais',
  settingsDescription:
    'Escolha quais regras podem gerar sinais. Os limites são fixos e cada regra tem uma versão.',
};
