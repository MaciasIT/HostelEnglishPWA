/**
 * Evaluador sintáctico y de cortesía post-turno (FC-04).
 *
 * Analiza la frase dicha por el alumno y señala mejoras de cortesía de forma
 * determinista y local (sin LLM, sin red), en línea con el verificador de
 * objetivo de FC-03. Detecta:
 *  - marcadores positivos de cortesía ("please", "could you", "thank you"...)
 *  - imperativos/expresiones directas ("Give me...", "I want...", "hurry up"…)
 *    y propone una alternativa más cortés en inglés.
 *
 * El análisis se hace por frases (separadas por puntuación) para no confundir
 * un "Give me" imperativo con un "Could you please give me...", que sí es cortés.
 */

import { normalizeText } from '@/utils/normalize';

/** Nivel de cortesía legible, derivado de la puntuación. */
export type CourtesyLevel = 'excelente' | 'buena' | 'mejorable' | 'descortés';

/** Un problema de cortesía detectado junto a su alternativa. */
export interface CourtesyIssue {
  /** Etiqueta canónica del patrón detectado (en inglés). */
  label: string;
  /** Frase literal (normalizada) que disparó la regla. */
  matched: string;
  /** Alternativa más cortés en inglés, lista para mostrar. */
  suggestion: string;
  /** Explicación en español de qué mejorar y por qué. */
  message: string;
}

export interface CourtesyEvaluation {
  /** 0–100; mayor = más cortés. */
  politenessScore: number;
  /** Marcadores positivos de cortesía detectados (canónicos). */
  politeMarkers: string[];
  /** Problemas de cortesía detectados. */
  issues: CourtesyIssue[];
  /** Etiqueta legible del nivel de cortesía. */
  level: CourtesyLevel;
}

/** Etiquetas de nivel para la UI. */
export const COURTESY_LEVEL_LABELS: Record<CourtesyLevel, string> = {
  excelente: 'Excelente',
  buena: 'Buena',
  mejorable: 'Mejorable',
  descortés: 'Descortés',
};

/** Marcadores positivos (ya normalizados) de cortesía en hostelería B1-B2. */
const POLITE_MARKERS: string[] = [
  'please',
  'could you',
  'would you',
  'may i',
  'could i',
  'thank you',
  'thanks',
  'excuse me',
  'sorry',
  'i would like',
  'id like',
  'would it be possible',
];

interface CourtesyRule {
  /** Identificador de la regla (para desduplicar). */
  id: string;
  /** Etiqueta canónica en inglés. */
  label: string;
  /** Regex aplicado sobre la frase normalizada. */
  test: RegExp;
  /** Alternativa más cortés propuesta. */
  suggestion: string;
  /** Explicación en español. */
  message: string;
}

/** Reglas de cortesía. El orden importa: la primera coincidencia gana por frase. */
const COURTESY_RULES: CourtesyRule[] = [
  {
    id: 'give_me',
    label: 'give me',
    test: /^give me\b/,
    suggestion: 'Could you please…?',
    message:
      'Prefiere «Could you please…?» a un imperativo directo como «Give me…».',
  },
  {
    id: 'get_me',
    label: 'get me',
    test: /^(get me|bring me)\b/,
    suggestion: 'Could you please get…?',
    message:
      '«Could you please get…?» suena más cortés que ordenar «Get me…».',
  },
  {
    id: 'i_want',
    label: 'I want',
    test: /\bi want\b/,
    suggestion: "I'd like…",
    message: '«I’d like…» es una forma más amable de expresar deseo que «I want…».',
  },
  {
    id: 'hurry_up',
    label: 'hurry up',
    test: /\bhurry up\b/,
    suggestion: 'Could you please…?',
    message: 'Evita «hurry up»; pide con cortesía («Could you please…?»).',
  },
  {
    id: 'you_must',
    label: 'you must',
    test: /\byou must\b/,
    suggestion: 'Could you…?',
    message: '«Could you…?» pide y no ordena; reemplaza a «You must…».',
  },
  {
    id: 'shut_up',
    label: 'shut up',
    test: /\bshut up\b/,
    suggestion: 'Could you please…?',
    message: '«Shut up» es inaceptable con un cliente; reformula con cortesía.',
  },
  {
    id: 'not_my_problem',
    label: "that's not my problem",
    test: /\bnot my problem\b/,
    suggestion: 'Let me check that for you.',
    message:
      'Mostrar disposición («Let me check that for you») genera más confianza que «not my problem».',
  },
  {
    id: 'i_dont_care',
    label: "I don't care",
    test: /\bi dont care\b/,
    suggestion: "I'd be happy to help with…",
    message: '«I’d be happy to help…» reemplaza a «I don’t care».',
  },
];

/** Divide el texto en frases por puntuación de cierre (respeta límites). */
function sentencesOf(text: string): string[] {
  return text
    .split(/[.!?;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** Convierte una puntuación 0–100 en su etiqueta de cortesía. */
export function courtesyLevelFor(score: number): CourtesyLevel {
  if (score >= 85) return 'excelente';
  if (score >= 55) return 'buena';
  if (score >= 30) return 'mejorable';
  return 'descortés';
}

/**
 * Evalúa la cortesía de una intervención del alumno.
 *
 * Por cada frase: detecta marcadores positivos y reglas de cortesía. La
 * puntuación parte de una base neutra (60), suma por marcador y resta por cada
 * problema detectado, acotada a [0, 100].
 */
export function evaluatePoliteness(text: string): CourtesyEvaluation {
  const sentences = sentencesOf(text);

  const politeMarkers = new Set<string>();
  const issues: CourtesyIssue[] = [];
  const seenRuleIds = new Set<string>();

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);
    if (!normalized) continue;

    for (const marker of POLITE_MARKERS) {
      if (normalized.includes(normalizeText(marker))) {
        politeMarkers.add(marker);
      }
    }

    for (const rule of COURTESY_RULES) {
      if (seenRuleIds.has(rule.id)) continue;
      const match = normalized.match(rule.test);
      if (match) {
        seenRuleIds.add(rule.id);
        issues.push({
          label: rule.label,
          matched: match[0],
          suggestion: rule.suggestion,
          message: rule.message,
        });
      }
    }
  }

  const score = 60 + politeMarkers.size * 10 - issues.length * 20;
  const politenessScore = Math.max(0, Math.min(100, score));

  return {
    politenessScore,
    politeMarkers: Array.from(politeMarkers),
    issues,
    level: courtesyLevelFor(politenessScore),
  };
}