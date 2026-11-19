import { BrandTile } from './brand-tile';

/*
 * Module illustrations in the "Selo da marca" style (DESIGN.md §4.3). Symbols
 * are drawn in the tile's 88 × 88 box: shapes in brand-foreground, and where
 * two shapes cross, a brand-colored outline cuts them apart (paint-order
 * stroke), like the dumbbell in the app icon.
 */

const fg = 'fill-brand-foreground';
const line = 'fill-none stroke-brand-foreground';

/** Sono: a crescent moon with "z z". */
export function SleepIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <path d="M50 18a26 26 0 1 0 22 38 21 21 0 0 1-22-38z" className={fg} />
      <path
        d="M20 20h10L20 31h10"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={line}
      />
      <path
        d="M10 36h6l-6 7h6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${line} opacity-80`}
      />
    </BrandTile>
  );
}

const PLATES = [
  { x: 18, y: 55, width: 52, height: 6, rx: 3 },
  { x: 21, y: 45, width: 9, height: 26, rx: 4 },
  { x: 58, y: 45, width: 9, height: 26, rx: 4 },
  { x: 14, y: 50, width: 6, height: 16, rx: 3 },
  { x: 68, y: 50, width: 6, height: 16, rx: 3 },
];

/** Treinos: a pulse over a tilted dumbbell. */
export function WorkoutsIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={6} className={className}>
      <path
        d="M10 30h14l5-10 8 22 6-14h16"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={line}
      />
      <g transform="rotate(-14 44 58)">
        <g strokeWidth="6" strokeLinejoin="round" className="fill-brand stroke-brand">
          {PLATES.map((r) => (
            <rect key={`h${r.x}`} {...r} />
          ))}
        </g>
        <g className={fg}>
          {PLATES.map((r) => (
            <rect key={r.x} {...r} />
          ))}
        </g>
      </g>
    </BrandTile>
  );
}

/** Peso: a bathroom scale with its dial pointing down. */
export function WeightIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <rect x="14" y="16" width="60" height="58" rx="16" className={fg} />
      <path d="M26 40a18 18 0 0 1 36 0z" className="fill-brand" />
      <path
        d="M44 40l7-10"
        strokeWidth="4"
        strokeLinecap="round"
        className="fill-none stroke-brand-foreground"
      />
      <circle cx="44" cy="40" r="3.5" className={fg} />
      <path
        d="M30 58h28"
        strokeWidth="4"
        strokeLinecap="round"
        className="fill-none stroke-brand opacity-40"
      />
    </BrandTile>
  );
}

/** Medidas: a tape measure with its tape pulled out. */
export function MeasurementsIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={6} className={className}>
      <rect x="40" y="52" width="38" height="16" rx="4" className={fg} />
      <path
        d="M48 52v7M56 52v5M64 52v7M72 52v5"
        strokeWidth="3"
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
      <circle
        cx="36"
        cy="44"
        r="24"
        strokeWidth="6"
        className="fill-brand-foreground stroke-brand"
      />
      <circle cx="36" cy="44" r="9" className="fill-brand" />
    </BrandTile>
  );
}

/** Nutrição › Favoritas: a star. */
export function FavoritesIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <path
        d="M44 14l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z"
        strokeWidth="3"
        strokeLinejoin="round"
        className="fill-brand-foreground stroke-brand-foreground"
      />
    </BrandTile>
  );
}

/** Nutrição › Alimentos: an apple with a leaf. */
export function FoodsIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={6} className={className}>
      <path
        d="M44 30c-6-4-12-5-18-3-9 3-13 12-12 22 2 14 12 26 22 26 4 0 6-2 8-2s4 2 8 2c10 0 20-12 22-26 1-10-3-19-12-22-6-2-12-1-18 3z"
        className={fg}
      />
      <path
        d="M44 30c0-6 2-12 6-16"
        strokeWidth="4"
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
      <path
        d="M50 22c2-8 9-12 17-11-1 8-8 13-17 11z"
        strokeWidth="3"
        paintOrder="stroke"
        className="fill-brand-foreground stroke-brand"
      />
    </BrandTile>
  );
}

/** Cardio: a stopwatch. */
export function CardioIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <rect x="37" y="10" width="14" height="8" rx="3" className={fg} />
      <circle cx="44" cy="48" r="28" className={fg} />
      <circle cx="44" cy="48" r="20" className="fill-brand" />
      <path
        d="M44 48V34M44 48l9 6"
        strokeWidth="5"
        strokeLinecap="round"
        className="fill-none stroke-brand-foreground"
      />
    </BrandTile>
  );
}

/** Hábitos: a checklist, two items done. */
export function HabitsIllustration({ className }: { className?: string }) {
  const rows = [18, 38, 58];
  return (
    <BrandTile tilt={6} className={className}>
      {rows.map((y, i) => (
        <g key={y}>
          <rect x="14" y={y} width="14" height="14" rx="4" className={fg} />
          {i < 2 && (
            <path
              d={`M17.5 ${y + 7.5}l3 3 5-6`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="fill-none stroke-brand"
            />
          )}
          <rect x="34" y={y + 4} width={i === 1 ? 30 : 40} height="6" rx="3" className={fg} />
        </g>
      ))}
    </BrandTile>
  );
}

/** Boas-vindas (criar perfil): a person with a plus. */
export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <circle cx="38" cy="32" r="13" className={fg} />
      <path d="M14 74c0-14 11-24 24-24s24 10 24 24z" className={fg} />
      <circle
        cx="64"
        cy="58"
        r="13"
        strokeWidth="5"
        className="fill-brand-foreground stroke-brand"
      />
      <path
        d="M64 52v12M58 58h12"
        strokeWidth="4"
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
    </BrandTile>
  );
}

/** Questionário: a target with an arrow in its center. */
export function GoalIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={6} className={className}>
      <circle cx="40" cy="48" r="28" className={fg} />
      <circle cx="40" cy="48" r="19" className="fill-brand" />
      <circle cx="40" cy="48" r="10" className={fg} />
      <path
        d="M40 48l30-30M62 16h9v9"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
      <path
        d="M40 48l30-30M62 16h9v9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand-foreground"
      />
    </BrandTile>
  );
}

/** Recuperação: a database with a restore arrow. */
export function RecoveryIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={-6} className={className}>
      <path d="M14 22c0-6 11-9 24-9s24 3 24 9v40c0 6-11 9-24 9s-24-3-24-9z" className={fg} />
      <path
        d="M14 22c0 6 11 9 24 9s24-3 24-9M14 42c0 6 11 9 24 9s24-3 24-9"
        strokeWidth="3"
        className="fill-none stroke-brand"
      />
      <circle
        cx="64"
        cy="62"
        r="15"
        strokeWidth="5"
        className="fill-brand-foreground stroke-brand"
      />
      <path
        d="M57 62a7 7 0 1 0 2-5M57 54v4h4"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
    </BrandTile>
  );
}

/** Erro: a warning triangle. */
export function ErrorIllustration({ className }: { className?: string }) {
  return (
    <BrandTile tilt={6} className={className}>
      <path
        d="M44 14L76 70H12z"
        strokeWidth="8"
        strokeLinejoin="round"
        className="fill-brand-foreground stroke-brand-foreground"
      />
      <path
        d="M44 34v16"
        strokeWidth="6"
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
      <circle cx="44" cy="60" r="3.5" className="fill-brand" />
    </BrandTile>
  );
}
