/**
 * Evaluador de adecuación hostelera (FD-03).
 *
 * Analiza cada respuesta del alumno en tres dimensiones y devuelve una nota de
 * cortesía profesional (0–100) más un comentario accionable y, cuando procede,
 * una frase alternativa más diplomática.
 *
 * Dimensiones:
 *  - **Cortesía / Modales**  → conectores diplomáticos (please, certainly,
 *    I apologize, may I…) frente a imperativos directos.
 *  - **Resolución práctica** → si responde directamente a lo que pide el
 *    cliente (let me, I will, right away…) o evade la solución (I don't know,
 *    not my problem…).
 *  - **Tono profesional**    → penaliza respuestas secas, agresivas o
 *    excesivamente informales («What?», «Wait», «No have»).
 *
 * Diseño determinista y local (sin LLM, sin red), coherente con el evaluador
 * de cortesía de FC-04 (`features/roleplay/courtesyEvaluator`) y con el motor
 * de verificación de objetivo de FC-03. Es un servicio de capa inferior: no
 * importa nada de `features/`, de modo que la UI (FD-04) lo consuma a voluntad.
 */

import { normalizeText } from '@/utils/normalize';

/* ------------------------------------------------------------------------- */
/* Contrato de salida                                                         */
/* ------------------------------------------------------------------------- */

export type PolitenessLevel = 'excelente' | 'buena' | 'mejorable' | 'descortés';

export const POLITENESS_LEVEL_LABELS: Record<PolitenessLevel, string> = {
  excelente: 'Excelente',
  buena: 'Buena',
  mejorable: 'Mejorable',
  descortés: 'Descortés',
};

/** Puntuación 0–100 de una dimensión junto a su comentario. */
export interface PolitenessDimensionScore {
  score: number;
  feedback: string;
}

export interface PolitenessEvaluation {
  /** Nota global 0–100 (mayor = más adecuado). */
  politenessScore: number;
  /** Comentario accionable en español. */
  hospitalityFeedback: string;
  /** Frase alternativa más diplomática (si se detectó algo que mejorar). */
  suggestedBetterPhrase?: string;
  /** Etiqueta legible derivada de la nota. */
  level: PolitenessLevel;
  courtesy: PolitenessDimensionScore;
  resolution: PolitenessDimensionScore;
  tone: PolitenessDimensionScore;
}

/** Convierte una nota 0–100 en su etiqueta (umbrales compartidos con FC-04). */
export function politenessLevelFor(score: number): PolitenessLevel {
  if (score >= 85) return 'excelente';
  if (score >= 55) return 'buena';
  if (score >= 30) return 'mejorable';
  return 'descortés';
}

/* ------------------------------------------------------------------------- */
/* Catálogos de detección                                                     */
/* ------------------------------------------------------------------------- */

/** Marcadores positivos de cortesía (ya normalizados), B1-B2 hostelería. */
const COURTESY_MARKERS: readonly string[] = [
  'please',
  'certainly',
  'may i',
  'could you',
  'would you',
  'thank you',
  'thanks',
  'excuse me',
  'i apologize',
  'my apologies',
  'i would like',
  'id like',
  'would it be possible',
  'of course',
];

/** Señales de resolución práctica (el alumno se compromete a actuar). */
const RESOLUTION_ACTIONS: readonly string[] = [
  'let me',
  'i will',
  'i can',
  'right away',
  'immediately',
  'i would be happy',
  'would you like',
];

/** Marcadores de tono profesional. */
const TONE_PROFESSIONAL: readonly string[] = [
  'certainly',
  'of course',
  'my apologies',
  'i apologize',
  'how may i assist',
  'sorry for the',
  'thank you for',
];

/** Una incidencia detectada cuya corrección aporta una alternativa más cortés. */
interface PolitenessIssue {
  id: string;
  /** Etiqueta canónica de la mala práctica (para el feedback). */
  label: string;
  dimension: 'courtesy' | 'resolution' | 'tone';
  /** Regex aplicado sobre la frase normalizada (puntuación ya eliminada). */
  test: RegExp;
  /** Alternativa más cortés en inglés, lista para mostrar. */
  suggestion: string;
}

/**
 * Reglas de penalización. Se aplican por frase (separada por puntuación de
 * cierre) y la primera coincidencia de cada regla gana, en línea con el
 * evaluador de FC-04 para no confundir un imperativo con una petición cortés.
 */
const ISSUE_RULES: readonly PolitenessIssue[] = [
  {
    id: 'dry_what',
    label: 'what',
    dimension: 'tone',
    test: /^what$/,
    suggestion: 'How may I help you?',
  },
  {
    id: 'dry_wait',
    label: 'wait',
    dimension: 'tone',
    test: /^wait$/,
    suggestion: 'One moment, please — let me check that for you.',
  },
  {
    id: 'no_have',
    label: 'no have',
    dimension: 'tone',
    test: /\bno have\b/,
    suggestion: "I'm afraid we don't have that — may I offer a similar option?",
  },
  {
    id: 'shut_up',
    label: 'shut up',
    dimension: 'tone',
    test: /\bshut up\b/,
    suggestion: 'I understand — let me help you with that.',
  },
  {
    id: 'whatever',
    label: 'whatever',
    dimension: 'tone',
    test: /\bwhatever\b/,
    suggestion: 'Of course, let me sort that out for you.',
  },
  {
    id: 'give_me',
    label: 'give me',
    dimension: 'courtesy',
    test: /^(give me|get me|bring me)\b/,
    suggestion: 'Could you please…?',
  },
  {
    id: 'i_want',
    label: 'I want',
    dimension: 'courtesy',
    test: /\bi want\b/,
    suggestion: "I'd like…",
  },
  {
    id: 'hurry_up',
    label: 'hurry up',
    dimension: 'courtesy',
    test: /\bhurry up\b/,
    suggestion: "Certainly, I'll be right with you.",
  },
  {
    id: 'you_must',
    label: 'you must',
    dimension: 'courtesy',
    test: /\byou must\b/,
    suggestion: 'Could you…?',
  },
  {
    id: 'not_my_problem',
    label: 'not my problem',
    dimension: 'resolution',
    test: /\bnot my problem\b/,
    suggestion: 'Let me look into that for you.',
  },
  {
    id: 'i_dont_know',
    label: "I don't know",
    dimension: 'resolution',
    test: /\bi dont know\b/,
    suggestion: 'Let me find out for you right away.',
  },
  {
    id: 'i_cant',
    label: "I can't",
    dimension: 'resolution',
    test: /\bi cant\b/,
    suggestion: "I'll see what I can do for you.",
  },
];

/* ------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* ------------------------------------------------------------------------- */

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Escapa caracteres especiales para construir un regex de límite de palabra. */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Divide el texto en frases por puntuación de cierre. */
function sentencesOf(text: string): string[] {
  return text
    .split(/[.!?;]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Cuenta cuántos marcadores de la lista aparecen como palabra/frase exacta en
 * el texto normalizado (límites de palabra para evitar falsos positivos como
 * «american» → "i can").
 */
function countHits(normalized: string, markers: readonly string[]): number {
  return markers.filter((marker) =>
    new RegExp(`\\b${escapeRegex(marker)}\\b`).test(normalized),
  ).length;
}

/* ------------------------------------------------------------------------- */
/* Evaluación                                                                 */
/* ------------------------------------------------------------------------- */

/**
 * Evalúa la adecuación hostelera de una respuesta del alumno.
 *
 * La nota global es la media ponderada de las tres dimensiones: cortesía (40 %),
 * resolución práctica (35 %) y tono profesional (25 %), cada una acotada a
 * [0, 100]. Devuelve además `hospitalityFeedback` (español) y, si se detectó
 * algo que corregir, `suggestedBetterPhrase` (inglés) con la alternativa más
 * prioritaria.
 */
export function evaluateHospitality(response: string): PolitenessEvaluation {
  const text = (response ?? '').trim();

  // Respuesta vacía: no hay nada que evaluar.
  if (!text) {
    return {
      politenessScore: 25,
      hospitalityFeedback:
        'No hubo respuesta. Intenta responder al cliente con una frase cortés y una solución concreta.',
      level: 'descortés',
      courtesy: { score: 25, feedback: 'Sin marcadores de cortesía.' },
      resolution: { score: 25, feedback: 'No se ofreció ninguna solución.' },
      tone: { score: 25, feedback: 'Sin contenido que evaluar.' },
    };
  }

  const sentences = sentencesOf(text);
  const fullNormalized = normalizeText(text);

  const politeMarkers = countHits(fullNormalized, COURTESY_MARKERS);
  const actions = countHits(fullNormalized, RESOLUTION_ACTIONS);
  const professional = countHits(fullNormalized, TONE_PROFESSIONAL);

  const issues: PolitenessIssue[] = [];
  const seenRuleIds = new Set<string>();

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);
    if (!normalized) continue;
    for (const rule of ISSUE_RULES) {
      if (seenRuleIds.has(rule.id)) continue;
      if (rule.test.test(normalized)) {
        seenRuleIds.add(rule.id);
        issues.push(rule);
      }
    }
  }

  const courtesyIssues = issues.filter((i) => i.dimension === 'courtesy').length;
  const resolutionIssues = issues.filter((i) => i.dimension === 'resolution').length;
  const toneIssues = issues.filter((i) => i.dimension === 'tone').length;

  const courtesy = clamp(50 + politeMarkers * 10 - courtesyIssues * 20);
  const resolution = clamp(50 + actions * 20 - resolutionIssues * 25);
  const tone = clamp(50 + professional * 12 - toneIssues * 20);

  const politenessScore = Math.round(
    0.4 * courtesy + 0.35 * resolution + 0.25 * tone,
  );

  const level = politenessLevelFor(politenessScore);

  return {
    politenessScore,
    hospitalityFeedback: buildFeedback(level, issues),
    suggestedBetterPhrase: issues.length > 0 ? issues[0].suggestion : undefined,
    level,
    courtesy: { score: courtesy, feedback: dimensionFeedback('courtesy', courtesy) },
    resolution: {
      score: resolution,
      feedback: dimensionFeedback('resolution', resolution),
    },
    tone: { score: tone, feedback: dimensionFeedback('tone', tone) },
  };
}

function buildFeedback(level: PolitenessLevel, issues: readonly PolitenessIssue[]): string {
  const base =
    level === 'excelente'
      ? 'Respuesta excelente: cortés, resolutiva y con tono profesional.'
      : level === 'buena'
        ? 'Buena respuesta; aún puedes pulir la resolución práctica o el tono.'
        : level === 'mejorable'
          ? 'Respuesta mejorable: refuerza la cortesía y cierra con una solución concreta.'
          : 'Respuesta descortés o evasiva: reformula con conectores diplomáticos y propón una solución.';

  if (issues.length === 0) return base;

  const labels = issues.map((issue) => `«${issue.label}»`).join(', ');
  return `${base} Detectado: ${labels}.`;
}

function dimensionFeedback(
  dim: 'courtesy' | 'resolution' | 'tone',
  score: number,
): string {
  if (score >= 85) {
    return dim === 'courtesy'
      ? 'Cortesía impecable.'
      : dim === 'resolution'
        ? 'Resolución práctica clara y comprometida.'
        : 'Tono profesional y afable.';
  }
  if (score >= 55) {
    return dim === 'courtesy'
      ? 'Cortesía correcta, con margen de mejora.'
      : dim === 'resolution'
        ? 'Resolución parcial; puedes ser más concreto.'
        : 'Tono aceptable, aunque algo neutro.';
  }
  return dim === 'courtesy'
    ? 'Faltan conectores diplomáticos (please, may i…).'
    : dim === 'resolution'
      ? 'Evita la solución o no responde a lo pedido.'
      : 'Tono seco o excesivamente informal.';
}