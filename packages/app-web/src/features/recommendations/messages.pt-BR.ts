import { formatLocalDate } from '@evully/app-core';
import type { RecommendationDto, RecommendationRule } from '@evully/contracts';

const kg = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const date = (d: string) => formatLocalDate(d);
const dayMonth = (d: string) => formatLocalDate(d).slice(0, 5);
/** `-0.7` → `"−0,7"`, with the sign as part of the number. */
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${kg.format(Math.abs(n))}`;
const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items.at(-1)}`;

type Evidence<R extends RecommendationRule> = Extract<RecommendationDto, { ruleId: R }>['evidence'];
type Progressed = Extract<
  Evidence<'double_progression'>,
  { exercises: unknown }
>['exercises'][number];

/** The exercises of a progression signal, from version 1 (one) or version 2 (a workout). */
function progressed(evidence: Evidence<'double_progression'>): Progressed[] {
  return 'exercises' in evidence ? evidence.exercises : [evidence];
}

function progressionText(evidence: Evidence<'double_progression'>) {
  const exercises = progressed(evidence);
  const [only] = exercises;
  const increments = exercises.flatMap((e) => (e.incrementKg === null ? [] : [e.incrementKg]));
  const same = increments.length === exercises.length && new Set(increments).size === 1;
  const increase =
    same && increments[0] !== undefined
      ? `Se quiser, aumente a carga em ${kg.format(increments[0])} kg no próximo treino.`
      : 'Se quiser, aumente a carga no próximo treino.';
  if (exercises.length === 1 && only) {
    const unit = only.targetType === 'reps' ? 'repetições' : 'segundos';
    return {
      title: `${only.exerciseName}: critério de progressão atingido`,
      body: `No treino de ${date(evidence.lastDate)} você concluiu as ${only.sets} séries no topo da faixa (${only.top} ${unit}). ${increase}`,
    };
  }
  return {
    title: `${exercises.length} exercícios atingiram o critério de progressão`,
    body: `No treino de ${date(evidence.lastDate)}, ${list(exercises.map((e) => e.exerciseName))} chegaram ao topo da faixa em todas as séries. ${increase}`,
  };
}

const objectiveNames = { fat_loss: 'perda de gordura', muscle_gain: 'ganho de massa' } as const;

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
    case 'double_progression':
      return progressionText(signal.evidence);
    case 'weight_plateau': {
      const e = signal.evidence;
      return {
        title: `Peso estável há ${e.days / 7} semanas`,
        body: `A média móvel foi de ${kg.format(e.trendStartKg)} kg para ${kg.format(e.trendEndKg)} kg em ${e.days} dias (${signed(e.changeKg)} kg), num projeto de ${objectiveNames[e.objective]}.`,
      };
    }
    case 'weight_rate_out_of_band': {
      const e = signal.evidence;
      return {
        title: 'Ritmo fora da faixa do projeto',
        body: `Nos últimos ${e.days} dias, a média móvel mudou ${signed(e.ratePerWeekKg)} kg por semana. A faixa do projeto vai de ${signed(e.minKg)} a ${signed(e.maxKg)} kg por semana.`,
      };
    }
    case 'volume_drop': {
      const [a, b, c] = signal.evidence.volumesKg.map((v) => `${whole.format(v)} kg`);
      return {
        title: 'Volume de treino em queda',
        body: `O volume caiu em dois períodos seguidos de ${signal.evidence.days} dias: ${a}, depois ${b} e agora ${c}.`,
      };
    }
    case 'low_adherence': {
      const e = signal.evidence;
      return {
        title: `Aderência ao plano em ${e.percent}%`,
        body: `Nos últimos ${e.days} dias você fez ${e.done} de ${e.planned} treinos previstos nos planos ativos.`,
      };
    }
  }
}

/** Why the rule fired, in one line per number, then the rule and its version. */
function reasons(signal: RecommendationDto): string[] {
  switch (signal.ruleId) {
    case 'weight_missing':
    case 'measurements_missing':
      return [
        `Último registro: ${date(signal.evidence.lastDate)} (${signal.evidence.daysSince} dias).`,
        `Aparece a partir de ${signal.evidence.limitDays} dias sem registro.`,
      ];
    case 'double_progression':
      return [
        ...progressed(signal.evidence).map(
          (e) =>
            `${e.exerciseName}: ${e.values.join(', ')} (topo da faixa: ${e.top})${e.incrementKg === null ? '' : `; incremento: ${kg.format(e.incrementKg)} kg`}.`,
        ),
        'Aparece quando todas as séries prescritas chegam ao topo da faixa, com o RIR dentro da faixa quando há um, em exercícios com carga.',
      ];
    case 'weight_plateau':
      return [
        `Variação da média móvel de 7 dias em ${signal.evidence.days} dias: ${signed(signal.evidence.changeKg)} kg.`,
        `Aparece quando ela muda menos de ${kg.format(signal.evidence.limitKg)} kg, num projeto de perda ou ganho.`,
      ];
    case 'weight_rate_out_of_band':
      return [
        `Ritmo: variação da média móvel em ${signal.evidence.days} dias, dividida por ${signal.evidence.days / 7} semanas.`,
        'A faixa é a que você definiu no projeto; sem faixa, esta regra não roda.',
      ];
    case 'volume_drop':
      return [
        `Treinos em cada período: ${signal.evidence.workouts.join(', ')}.`,
        `Aparece quando o volume (carga × repetições) cai mais de ${signal.evidence.limitPercent}% em dois períodos seguidos, com pelo menos 2 treinos em cada.`,
      ];
    case 'low_adherence':
      return [
        `Dias previstos: os dias da semana dos planos ativos, desde a criação de cada um.`,
        `Aparece abaixo de ${signal.evidence.limitPercent}%, com pelo menos 4 dias previstos.`,
      ];
  }
}

/** The numbers behind a signal, for "Por que estou vendo isso?". */
export function signalWhy(signal: RecommendationDto): string[] {
  return [
    ...reasons(signal),
    `Regra "${ruleNames[signal.ruleId]}", versão ${signal.ruleVersion}, detectada em ${date(signal.detectedOn)}.`,
  ];
}

export const ruleNames: Record<RecommendationRule, string> = {
  weight_missing: 'Pesagem ausente',
  measurements_missing: 'Medidas ausentes',
  double_progression: 'Progressão dupla',
  weight_plateau: 'Peso estável',
  weight_rate_out_of_band: 'Ritmo fora da faixa',
  volume_drop: 'Queda de volume',
  low_adherence: 'Baixa aderência ao plano',
};

export const ruleDescriptions: Record<RecommendationRule, string> = {
  weight_missing: 'Avisa depois de 7 dias sem pesagem.',
  measurements_missing: 'Avisa depois de 21 dias sem medidas, se você acompanha alguma.',
  double_progression:
    'Avisa quando exercícios de um treino atingiram o critério para aumentar a carga.',
  weight_plateau:
    'Avisa quando a média móvel muda menos de 0,2 kg em 21 dias, num projeto de perda ou ganho.',
  weight_rate_out_of_band:
    'Avisa quando o ritmo dos últimos 14 dias sai da faixa definida no projeto.',
  volume_drop: 'Avisa quando o volume de treino cai mais de 10% em dois períodos de 14 dias.',
  low_adherence: 'Avisa abaixo de 60% dos treinos previstos nos últimos 14 dias.',
};

/** Where the user goes to act on a signal. */
export const signalAction: Record<RecommendationRule, { label: string; to: string }> = {
  weight_missing: { label: 'Registrar peso', to: '/app/weight' },
  measurements_missing: { label: 'Registrar medidas', to: '/app/measurements' },
  double_progression: { label: 'Abrir treinos', to: '/app/workouts' },
  weight_plateau: { label: 'Ver progresso', to: '/app/stats' },
  weight_rate_out_of_band: { label: 'Ver progresso', to: '/app/stats' },
  volume_drop: { label: 'Ver progresso', to: '/app/stats' },
  low_adherence: { label: 'Abrir treinos', to: '/app/workouts' },
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
