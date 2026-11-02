import { useState } from 'react';
import { SpeakerWaveIcon, PlayIcon } from '@heroicons/react/24/outline';

export interface WordFeedback {
  word: string;
  /** Puntuación fonética individual 0–100. */
  score: number;
  /** Consejo articulatorio en español (se muestra en ámbar/rojo). */
  tip?: string;
}

export interface PhoneticAxes {
  accuracy: number;
  fluency: number;
  prosody: number;
  completeness: number;
}

export interface PhoneticFeedbackCardProps {
  words: WordFeedback[];
  scores: PhoneticAxes;
  onPlayReference?: () => void;
  onPlayUser?: () => void;
  className?: string;
}

export type WordLevel = 'good' | 'warning' | 'bad';

export const GOOD_THRESHOLD = 80;
export const WARNING_THRESHOLD = 50;

export function getWordLevel(score: number): WordLevel {
  if (score >= GOOD_THRESHOLD) return 'good';
  if (score >= WARNING_THRESHOLD) return 'warning';
  return 'bad';
}

const LEVEL_STYLE: Record<WordLevel, string> = {
  good: 'bg-emerald-500/15 text-success-text  border-emerald-500/40',
  warning: 'bg-amber-500/15 text-warning-text  border-amber-500/40',
  bad: 'bg-red-500/15 text-error-text  border-red-500/40',
};

const LEVEL_LABEL: Record<WordLevel, string> = {
  good: 'correcta',
  warning: 'mejorable',
  bad: 'incorrecta',
};

const AXES: { key: keyof PhoneticAxes; label: string }[] = [
  { key: 'accuracy', label: 'Precisión Léxica' },
  { key: 'fluency', label: 'Ritmo/Fluidez' },
  { key: 'prosody', label: 'Entonación' },
  { key: 'completeness', label: 'Completitud' },
];

const clamp = (n: number) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));

function RadarChart({ scores }: { scores: PhoneticAxes }) {
  const size = 200;
  const c = size / 2;
  const r = 70;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
  const point = (i: number, ratio: number) =>
    `${(c + Math.cos(angle(i)) * r * ratio).toFixed(1)},${(c + Math.sin(angle(i)) * r * ratio).toFixed(1)}`;
  const polygon = AXES.map((a, i) => point(i, clamp(scores[a.key]) / 100)).join(' ');
  const summary = AXES.map((a) => `${a.label} ${Math.round(clamp(scores[a.key]))}`).join(', ');

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[16rem] h-auto"
        role="img"
        aria-label={`Gráfica radial: ${summary}`}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={AXES.map((_, i) => point(i, ratio)).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth={1}
          />
        ))}
        {AXES.map((_, i) => (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={point(i, 1).split(',')[0]}
            y2={point(i, 1).split(',')[1]}
            stroke="currentColor"
            className="text-muted/30"
          />
        ))}
        <polygon points={polygon} className="fill-accent/30 stroke-accent" strokeWidth={2} />
        {AXES.map((a, i) => {
          const [x, y] = point(i, 1.22).split(',').map(Number);
          return (
            <text
              key={a.key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-secondary"
              fontSize={9}
            >
              {a.label}
            </text>
          );
        })}
      </svg>
      <ul className="sr-only">
        {AXES.map((a) => (
          <li key={a.key}>
            {a.label}: {Math.round(clamp(scores[a.key]))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PhoneticFeedbackCard({
  words,
  scores,
  onPlayReference,
  onPlayUser,
  className = '',
}: PhoneticFeedbackCardProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      aria-label="Feedback de pronunciación"
      className={`bg-surface border border-border rounded-3xl p-5 sm:p-8 flex flex-col gap-6 ${className}`}
    >
      <div>
        <h3 className="text-[10px] uppercase font-black text-accent-text tracking-[0.3em] mb-3">
          Mapa de pronunciación
        </h3>
        <ul className="flex flex-wrap gap-2" aria-label="Palabras de la frase">
          {words.map((w, i) => {
            const level = getWordLevel(w.score);
            const interactive = level !== 'good';
            const base = `inline-flex items-center px-3 py-2 min-h-11 rounded-xl border text-base font-semibold ${LEVEL_STYLE[level]}`;
            const label = `${w.word}, pronunciación ${LEVEL_LABEL[level]}, ${Math.round(w.score)} sobre 100`;
            return (
              <li key={`${w.word}-${i}`} className="relative">
                {interactive ? (
                  <button
                    type="button"
                    className={`${base} cursor-pointer focus-visible:outline-2 focus-visible:outline-accent`}
                    aria-label={label}
                    aria-expanded={openIndex === i}
                    aria-controls={`phonetic-tip-${i}`}
                    data-level={level}
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    {w.word}
                  </button>
                ) : (
                  <span className={base} aria-label={label} data-level={level}>
                    {w.word}
                  </span>
                )}
                {interactive && openIndex === i && (
                  <div
                    id={`phonetic-tip-${i}`}
                    role="tooltip"
                    className="absolute z-10 left-0 top-full mt-2 w-64 max-w-[80vw] rounded-xl bg-primary text-secondary border border-border p-3 text-sm shadow-xl"
                  >
                    {w.tip ?? 'Repite la palabra despacio, articulando cada sonido.'}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Verde: bien · Ámbar: mejorable · Rojo: corregir. Pulsa una palabra ámbar o roja para ver el consejo.
        </p>
      </div>

      <RadarChart scores={scores} />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onPlayReference}
          disabled={!onPlayReference}
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-accent text-primary font-bold px-4 py-3 disabled:opacity-50"
        >
          <SpeakerWaveIcon className="w-5 h-5" aria-hidden="true" />
          Escuchar nativo
        </button>
        <button
          type="button"
          onClick={onPlayUser}
          disabled={!onPlayUser}
          className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-accent text-accent-text font-bold px-4 py-3 disabled:opacity-50"
        >
          <PlayIcon className="w-5 h-5" aria-hidden="true" />
          Escuchar mi grabación
        </button>
      </div>
    </section>
  );
}
