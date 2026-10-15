const oneDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** `89.8` → `"89,8 kg"` (README §6.3: one decimal on screen). */
export function formatKg(value: number): string {
  return `${oneDecimal.format(value)} kg`;
}

export function formatCm(value: number): string {
  return `${oneDecimal.format(value)} cm`;
}

/** Signed change for badges: `-1.9` → `"▼ 1,9 kg"`, `0.04` → `"Estável"`. */
export function formatChange(value: number, unit: 'kg' | 'cm', stableThreshold = 0.1): string {
  if (Math.abs(value) < stableThreshold) return 'Estável';
  return `${value < 0 ? '▼' : '▲'} ${oneDecimal.format(Math.abs(value))} ${unit}`;
}

/** Parses a number typed with comma or dot ("89,8" or "89.8"); null when not a number. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}
