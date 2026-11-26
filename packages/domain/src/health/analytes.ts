/**
 * Common laboratory markers (README §24.3). A name and the usual unit to
 * prefill the form, plus one neutral sentence on what the marker measures. The
 * reference range always comes from the laboratory's report, never from here
 * (§24.2), and the sentence never says what a value means for the person.
 */
export interface Analyte {
  code: string;
  name: string;
  unit: string;
  about: string;
}

export const ANALYTES: readonly Analyte[] = [
  {
    code: 'hemoglobin',
    name: 'Hemoglobina',
    unit: 'g/dL',
    about: 'Proteína dos glóbulos vermelhos que transporta oxigênio pelo sangue.',
  },
  {
    code: 'hematocrit',
    name: 'Hematócrito',
    unit: '%',
    about: 'Proporção do volume do sangue ocupada pelos glóbulos vermelhos.',
  },
  {
    code: 'leukocytes',
    name: 'Leucócitos',
    unit: '/mm³',
    about: 'Quantidade de glóbulos brancos, células que participam da defesa do organismo.',
  },
  {
    code: 'platelets',
    name: 'Plaquetas',
    unit: '/mm³',
    about: 'Fragmentos de células do sangue que participam da coagulação.',
  },
  {
    code: 'fasting_glucose',
    name: 'Glicose em jejum',
    unit: 'mg/dL',
    about: 'Quantidade de açúcar no sangue depois de um período sem comer.',
  },
  {
    code: 'hba1c',
    name: 'Hemoglobina glicada (HbA1c)',
    unit: '%',
    about: 'Reflete a média da glicose no sangue nos últimos dois a três meses.',
  },
  {
    code: 'insulin',
    name: 'Insulina',
    unit: 'µUI/mL',
    about: 'Hormônio produzido pelo pâncreas que ajuda a glicose a entrar nas células.',
  },
  {
    code: 'total_cholesterol',
    name: 'Colesterol total',
    unit: 'mg/dL',
    about: 'Soma das frações de colesterol transportadas no sangue.',
  },
  {
    code: 'hdl',
    name: 'HDL',
    unit: 'mg/dL',
    about: 'Fração do colesterol que leva o excesso de gordura dos tecidos de volta ao fígado.',
  },
  {
    code: 'ldl',
    name: 'LDL',
    unit: 'mg/dL',
    about: 'Fração do colesterol que leva gordura do fígado para os tecidos.',
  },
  {
    code: 'triglycerides',
    name: 'Triglicerídeos',
    unit: 'mg/dL',
    about: 'Gorduras do sangue usadas como reserva de energia.',
  },
  {
    code: 'creatinine',
    name: 'Creatinina',
    unit: 'mg/dL',
    about: 'Resíduo do metabolismo muscular eliminado pelos rins.',
  },
  {
    code: 'urea',
    name: 'Ureia',
    unit: 'mg/dL',
    about: 'Resíduo do metabolismo das proteínas eliminado pelos rins.',
  },
  {
    code: 'uric_acid',
    name: 'Ácido úrico',
    unit: 'mg/dL',
    about: 'Resíduo da degradação das purinas, presentes em alimentos e nas células.',
  },
  {
    code: 'ast',
    name: 'TGO (AST)',
    unit: 'U/L',
    about: 'Enzima presente no fígado, nos músculos e em outros tecidos.',
  },
  {
    code: 'alt',
    name: 'TGP (ALT)',
    unit: 'U/L',
    about: 'Enzima encontrada principalmente no fígado.',
  },
  {
    code: 'ggt',
    name: 'Gama GT',
    unit: 'U/L',
    about: 'Enzima ligada ao fígado e às vias biliares.',
  },
  {
    code: 'ck',
    name: 'CK (creatinoquinase)',
    unit: 'U/L',
    about: 'Enzima dos músculos; costuma variar depois de esforço físico intenso.',
  },
  {
    code: 'tsh',
    name: 'TSH',
    unit: 'µUI/mL',
    about: 'Hormônio da hipófise que regula o funcionamento da tireoide.',
  },
  {
    code: 'free_t4',
    name: 'T4 livre',
    unit: 'ng/dL',
    about: 'Hormônio produzido pela tireoide, na forma disponível para o organismo.',
  },
  {
    code: 'vitamin_d',
    name: 'Vitamina D (25-OH)',
    unit: 'ng/mL',
    about: 'Forma da vitamina D medida no sangue; participa do metabolismo do cálcio.',
  },
  {
    code: 'vitamin_b12',
    name: 'Vitamina B12',
    unit: 'pg/mL',
    about: 'Vitamina que participa da formação do sangue e do funcionamento dos nervos.',
  },
  {
    code: 'folate',
    name: 'Ácido fólico',
    unit: 'ng/mL',
    about: 'Vitamina do complexo B que participa da formação das células.',
  },
  {
    code: 'ferritin',
    name: 'Ferritina',
    unit: 'ng/mL',
    about: 'Proteína que armazena ferro; reflete as reservas de ferro do organismo.',
  },
  {
    code: 'serum_iron',
    name: 'Ferro sérico',
    unit: 'µg/dL',
    about: 'Quantidade de ferro circulando no sangue no momento da coleta.',
  },
  {
    code: 'sodium',
    name: 'Sódio',
    unit: 'mEq/L',
    about: 'Mineral que participa do equilíbrio de líquidos do corpo.',
  },
  {
    code: 'potassium',
    name: 'Potássio',
    unit: 'mEq/L',
    about: 'Mineral que participa do funcionamento dos músculos e dos nervos.',
  },
  {
    code: 'calcium',
    name: 'Cálcio',
    unit: 'mg/dL',
    about: 'Mineral dos ossos que também participa da contração muscular.',
  },
  {
    code: 'magnesium',
    name: 'Magnésio',
    unit: 'mg/dL',
    about: 'Mineral que participa de muitas reações do metabolismo e da função muscular.',
  },
  {
    code: 'crp',
    name: 'Proteína C reativa (PCR)',
    unit: 'mg/L',
    about: 'Proteína produzida pelo fígado que costuma aumentar em processos inflamatórios.',
  },
  {
    code: 'total_testosterone',
    name: 'Testosterona total',
    unit: 'ng/dL',
    about: 'Hormônio sexual presente em todas as pessoas, em quantidades diferentes.',
  },
  {
    code: 'cortisol',
    name: 'Cortisol',
    unit: 'µg/dL',
    about: 'Hormônio das glândulas suprarrenais; varia ao longo do dia.',
  },
];

const BY_CODE = new Map(ANALYTES.map((a) => [a.code, a]));

export const analyteByCode = (code: string): Analyte | null => BY_CODE.get(code) ?? null;
