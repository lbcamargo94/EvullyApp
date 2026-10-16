import { parseLocalDate, type LocalDate } from '../local-date';

export type CsvDelimiter = ';' | ',';

export interface CsvRow {
  /** 1-based line number in the file (the header is line 1). */
  line: number;
  cells: string[];
}

export interface ParsedCsv {
  delimiter: CsvDelimiter;
  header: string[];
  /** Non-empty data rows. */
  rows: CsvRow[];
}

const BOM = /^\uFEFF/;
const DIACRITICS = /[\u0300-\u036f]/g;

/**
 * Minimal RFC 4180 reader: quoted fields, escaped quotes, CRLF or LF, BOM.
 * The delimiter is detected from the header: `;` (Brazilian Excel) or `,`.
 */
export function parseCsv(text: string): ParsedCsv {
  const content = text.replace(BOM, '');
  const firstLine = content.split(/\r?\n/, 1)[0] ?? '';
  const delimiter: CsvDelimiter = firstLine.includes(';') ? ';' : ',';
  const [headerRecord, ...dataRecords] = new CsvReader(content, delimiter).read();
  return {
    delimiter,
    header: (headerRecord?.cells ?? []).map(normalizeHeader),
    rows: dataRecords.filter((r) => r.cells.some((c) => c.trim() !== '')),
  };
}

/** Character-by-character state machine; each step stays small and readable. */
class CsvReader {
  private readonly records: CsvRow[] = [];
  private cells: string[] = [];
  private cell = '';
  private quoted = false;
  private line = 1;
  private recordLine = 1;
  private i = 0;

  constructor(
    private readonly content: string,
    private readonly delimiter: CsvDelimiter,
  ) {}

  read(): CsvRow[] {
    for (this.i = 0; this.i < this.content.length; this.i++) {
      const char = this.content[this.i] ?? '';
      if (this.quoted) this.readQuoted(char);
      else this.readPlain(char);
    }
    if (this.cell !== '' || this.cells.length) this.endRecord();
    return this.records;
  }

  private readQuoted(char: string) {
    if (char === '"' && this.content[this.i + 1] === '"') {
      this.cell += '"';
      this.i++;
    } else if (char === '"') {
      this.quoted = false;
    } else {
      if (char === '\n') this.line++;
      this.cell += char;
    }
  }

  private readPlain(char: string) {
    if (char === '"') this.quoted = true;
    else if (char === this.delimiter) this.endCell();
    else if (char === '\n' || char === '\r') this.endLine(char);
    else this.cell += char;
  }

  private endLine(char: string) {
    if (char === '\r' && this.content[this.i + 1] === '\n') this.i++;
    this.endRecord();
    this.line++;
    this.recordLine = this.line;
  }

  private endCell() {
    this.cells.push(this.cell);
    this.cell = '';
  }

  private endRecord() {
    this.endCell();
    this.records.push({ line: this.recordLine, cells: this.cells });
    this.cells = [];
  }
}

/** `"Observação "` → `observacao`; matches template column names regardless of accents and case. */
export function normalizeHeader(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(DIACRITICS, '').replace(/\s+/g, '_');
}

/** Decimal with comma or dot ("89,8", "89.8"). */
export function parseCsvDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : null;
}

/** `DD/MM/AAAA` or `AAAA-MM-DD`; null when invalid. */
export function parseCsvDate(text: string): LocalDate | null {
  const value = text.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : value;
  try {
    return parseLocalDate(iso);
  } catch {
    return null;
  }
}

/** `HH:mm` (or `H:mm`); empty means "not informed" (undefined); null when invalid. */
export function parseCsvTime(text: string): string | null | undefined {
  const value = text.trim();
  if (!value) return undefined;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
}
