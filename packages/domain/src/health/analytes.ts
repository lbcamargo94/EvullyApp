/**
 * Common laboratory markers (README §24.3). Only a name and the usual unit to
 * prefill the form: the reference range always comes from the laboratory's
 * report, never from here (§24.2). Informative texts arrive in 1.5.0-alpha.2.
 */
export interface Analyte {
  code: string;
  name: string;
  unit: string;
}

export const ANALYTES: readonly Analyte[] = [
  { code: 'hemoglobin', name: 'Hemoglobina', unit: 'g/dL' },
  { code: 'hematocrit', name: 'Hematócrito', unit: '%' },
  { code: 'leukocytes', name: 'Leucócitos', unit: '/mm³' },
  { code: 'platelets', name: 'Plaquetas', unit: '/mm³' },
  { code: 'fasting_glucose', name: 'Glicose em jejum', unit: 'mg/dL' },
  { code: 'hba1c', name: 'Hemoglobina glicada (HbA1c)', unit: '%' },
  { code: 'insulin', name: 'Insulina', unit: 'µUI/mL' },
  { code: 'total_cholesterol', name: 'Colesterol total', unit: 'mg/dL' },
  { code: 'hdl', name: 'HDL', unit: 'mg/dL' },
  { code: 'ldl', name: 'LDL', unit: 'mg/dL' },
  { code: 'triglycerides', name: 'Triglicerídeos', unit: 'mg/dL' },
  { code: 'creatinine', name: 'Creatinina', unit: 'mg/dL' },
  { code: 'urea', name: 'Ureia', unit: 'mg/dL' },
  { code: 'uric_acid', name: 'Ácido úrico', unit: 'mg/dL' },
  { code: 'ast', name: 'TGO (AST)', unit: 'U/L' },
  { code: 'alt', name: 'TGP (ALT)', unit: 'U/L' },
  { code: 'ggt', name: 'Gama GT', unit: 'U/L' },
  { code: 'ck', name: 'CK (creatinoquinase)', unit: 'U/L' },
  { code: 'tsh', name: 'TSH', unit: 'µUI/mL' },
  { code: 'free_t4', name: 'T4 livre', unit: 'ng/dL' },
  { code: 'vitamin_d', name: 'Vitamina D (25-OH)', unit: 'ng/mL' },
  { code: 'vitamin_b12', name: 'Vitamina B12', unit: 'pg/mL' },
  { code: 'folate', name: 'Ácido fólico', unit: 'ng/mL' },
  { code: 'ferritin', name: 'Ferritina', unit: 'ng/mL' },
  { code: 'serum_iron', name: 'Ferro sérico', unit: 'µg/dL' },
  { code: 'sodium', name: 'Sódio', unit: 'mEq/L' },
  { code: 'potassium', name: 'Potássio', unit: 'mEq/L' },
  { code: 'calcium', name: 'Cálcio', unit: 'mg/dL' },
  { code: 'magnesium', name: 'Magnésio', unit: 'mg/dL' },
  { code: 'crp', name: 'Proteína C reativa (PCR)', unit: 'mg/L' },
  { code: 'total_testosterone', name: 'Testosterona total', unit: 'ng/dL' },
  { code: 'cortisol', name: 'Cortisol', unit: 'µg/dL' },
];

const BY_CODE = new Map(ANALYTES.map((a) => [a.code, a]));

export const analyteByCode = (code: string): Analyte | null => BY_CODE.get(code) ?? null;
