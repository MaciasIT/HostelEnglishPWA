import { z } from 'zod';

/**
 * aiContentGenerator — generador asistido de contenidos para examen.
 *
 * Herramienta interna y opt-in (Fase C, no-core) que produce:
 *   1. Variantes sintácticas de una misma intención (p. ej. una petición
 *      cortés reescrita con distinto grado de formalidad y sinónimos).
 *   2. Distractores gramaticales verosímiles pero erróneos (errores típicos
 *      de hispanohablantes: concordancia, preposiciones, artículos, orden de
 *      palabras y forma verbal) para preguntas de selección múltiple.
 *
 * Diseño:
 *   - Determinista y offline-first: sin llamadas de red, compatible con el
 *     modelo offline de la app. Las salidas son reproducibles dado un `seed`.
 *   - Opt-in y auditable: cada variante/distractor lleva `requiresReview: true`
 *     porque el roadmap exige revisión humana antes de publicar contenido.
 *   - Costura para un proveedor LLM futuro: el tipo `AiContentGeneratorProvider`
 *     permite sustituir el motor de reglas por un modelo on-device sin tocar
 *     a los consumidores.
 *
 * Público objetivo: hispanohablantes en hostelería (nivel A2/B1).
 */

// ---------------------------------------------------------------------------
// Esquemas Zod de validación de salida
// ---------------------------------------------------------------------------

export const GenerationFormalitySchema = z.enum(['formal', 'neutral', 'informal']);
export type GenerationFormality = z.infer<typeof GenerationFormalitySchema>;

/** Ejes de transformación aplicados a una variante. */
export const VariantKindSchema = z.enum(['lexical', 'syntactic', 'politeness', 'voice']);
export type VariantKind = z.infer<typeof VariantKindSchema>;

export const SentenceVariantSchema = z.object({
  /** Frase reescrita, no vacía. */
  text: z.string().min(1),
  formality: GenerationFormalitySchema,
  kinds: z.array(VariantKindSchema),
  /** true => conserva el significado/intención de la frase original. */
  preservesIntent: z.boolean(),
  /** true => generación automática pendiente de revisión humana. */
  requiresReview: z.boolean(),
});
export type SentenceVariant = z.infer<typeof SentenceVariantSchema>;

export const GrammarErrorTypeSchema = z.enum([
  'agreement',
  'preposition',
  'article',
  'word_order',
  'verb_form',
]);
export type GrammarErrorType = z.infer<typeof GrammarErrorTypeSchema>;

export const DistractorSchema = z.object({
  /** Opción incorrecta pero verosímil. */
  text: z.string().min(1),
  errorType: GrammarErrorTypeSchema,
  /** Explicación pedagógica del error (en español). */
  explanation: z.string().min(1),
  /** Frase correcta de referencia (sin el error introducido). */
  correctReference: z.string().min(1),
  /** true => plausible para un estudiante A2/B1. */
  plausible: z.boolean(),
  requiresReview: z.boolean(),
});
export type Distractor = z.infer<typeof DistractorSchema>;

export const GenerationOptionsSchema = z.object({
  /** Número máximo de variantes a devolver. */
  maxVariants: z.number().int().min(1).max(24).default(6),
  /** Número máximo de distractores a devolver. */
  maxDistractors: z.number().int().min(0).max(8).default(3),
  /** Semilla para un orden determinista. */
  seed: z.number().int().nonnegative().optional(),
});
/** Opciones de entrada: todos los campos son opcionales (se rellenan con defaults). */
export type GenerationOptions = z.input<typeof GenerationOptionsSchema>;
/** Opciones ya validadas con los defaults aplicados. */
export type ResolvedGenerationOptions = z.infer<typeof GenerationOptionsSchema>;

export const MultipleChoiceOptionsSchema = z.object({
  correct: z.string().min(1),
  /** Opciones ya mezcladas (incluye la correcta). */
  options: z.array(z.string().min(1)),
  distractors: z.array(DistractorSchema),
});

/** Contrato de un proveedor de generación (permite sustitución futura). */
export interface AiContentGeneratorProvider {
  generateVariants(source: string, opts?: GenerationOptions): SentenceVariant[];
  generateDistractors(correct: string, opts?: GenerationOptions): Distractor[];
}

// ---------------------------------------------------------------------------
// Utilidades deterministas
// ---------------------------------------------------------------------------

/** RNG determinista (mulberry32) derivado de una semilla entera. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Barajado determinista (Fisher-Yates) que no muta el array original. */
export function seededShuffle<T>(items: T[], seed = 0): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Devuelve una lista sin duplicados (comparación sensible a mayúsculas). */
function unique<T extends { text: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.text.trim();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Catálogo de transformaciones léxicas (sinónimos del dominio hostelería)
// ---------------------------------------------------------------------------

/**
 * Mapa de sinónimos contextuales por token (minúsculas). Las claves se
 * aplican solo sobre el objeto de una petición o sobre tokens aislados,
 * nunca de forma global indiscriminada.
 */
const LEXICAL_SYNONYMS: Record<string, string[]> = {
  bill: ['check'],
  check: ['bill'],
  toilet: ['restroom', 'bathroom'],
  restroom: ['toilet', 'bathroom'],
  bathroom: ['toilet', 'restroom'],
  help: ['assistance'],
  assistance: ['help'],
  menu: ['food menu'],
  'food menu': ['menu'],
  room: ['bedroom'],
  'a drink': ['something to drink'],
  'something to drink': ['a drink'],
};

/** Sustituye una ocurrencia (word-boundary, case-insensitive) de un token. */
function replaceToken(text: string, from: string, to: string): string {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'i');
  return text.replace(re, to);
}

/**
 * Genera variantes del texto sustituyendo sinónimos de un token dado.
 * Devuelve pares { texto, ejes } sin duplicados.
 */
function synonymTokenVariants(text: string, token: string): { text: string; kinds: VariantKind[] }[] {
  const synonyms = LEXICAL_SYNONYMS[token.toLowerCase()];
  if (!synonyms || synonyms.length === 0) return [];
  return synonyms
    .map((syn) => ({ text: replaceToken(text, token, syn), kinds: ['lexical' as VariantKind] }))
    .filter((v) => v.text.trim().toLowerCase() !== text.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// 1. Generador de variantes sintácticas (misma intención)
// ---------------------------------------------------------------------------

interface RequestExtraction {
  /** Pronombre del hablante detectado ('i', 'we', 'you'). */
  pronoun: string;
  /** Complemento objeto de la petición (p. ej. 'the bill'). */
  object: string;
}

/** Extrae el objeto de una petición cortés común ('Could I have X?', ...). */
function extractRequest(source: string): RequestExtraction | null {
  const s = source.trim().replace(/[?.!]+$/, '').trim();

  const frame = s.match(/^(?:could|can|may)\s+(i|we|you)\s+(?:please\s+)?(?:have|get)\s+(.+)$/i);
  if (frame) {
    return { pronoun: frame[1].toLowerCase(), object: frame[2] };
  }

  const like = s.match(/^i(?:'d| would) like\s+(.+)$/i);
  if (like) {
    return { pronoun: 'i', object: like[1] };
  }

  return null;
}

interface RequestTemplate {
  formality: GenerationFormality;
  kinds: VariantKind[];
  frames: string[];
}

/** Escalera de cortesía: reencuadres de la misma petición por formalidad. */
const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    formality: 'formal',
    kinds: ['syntactic', 'politeness'],
    frames: [
      'May I have {obj}, please?',
      'Could I have {obj}, please?',
      'I would be most grateful for {obj}.',
      'Would you mind bringing me {obj}?',
    ],
  },
  {
    formality: 'neutral',
    kinds: ['syntactic', 'politeness'],
    frames: [
      'Could I get {obj}, please?',
      'Can I have {obj}, please?',
      'I would like {obj}, please.',
      'May we get {obj}, please?',
    ],
  },
  {
    formality: 'informal',
    kinds: ['syntactic', 'voice'],
    frames: ['Can I get {obj}?', 'Have you got {obj}?', 'Just {obj}, please.'],
  },
];

/** Lista de variantes (variando sinónimos del objeto) para una petición. */
function objectVariants(object: string): { text: string; lexical: boolean }[] {
  // Sinónimos del objeto completo y de cada token contenido.
  const candidates: { text: string; lexical: boolean }[] = [{ text: object, lexical: false }];
  for (const token of object.split(/\s+/)) {
    for (const v of synonymTokenVariants(object, token)) {
      candidates.push({ text: v.text, lexical: true });
    }
  }
  return candidates;
}

/** Recorre sinónimos conocidos en toda la frase (fallback no-petición). */
function genericSynonymVariants(source: string): { text: string; kinds: VariantKind[] }[] {
  const tokens = source.split(/\s+/);
  const out: { text: string; kinds: VariantKind[] }[] = [];
  for (const token of tokens) {
    out.push(...synonymTokenVariants(source, token));
  }
  return out;
}

/**
 * Genera variantes sintácticas que conservan la intención de la frase.
 *
 * - Si detecta una petición ('Could I have the bill?'), produce un abanico de
 *   reformulaciones por formalidad y sinónimos (incluida 'May we get the
 *   check, please?').
 * - Si no, recurre a sustitución léxica genérica.
 * - Como mínimo devuelve la frase original marcada como `neutral`.
 */
export function generateVariants(source: string, opts?: GenerationOptions): SentenceVariant[] {
  const options = GenerationOptionsSchema.parse(opts ?? {});
  const raw = (source ?? '').trim();
  if (!raw) return [];

  const variants: SentenceVariant[] = [];

  const request = extractRequest(raw);
  if (request) {
    for (const obj of objectVariants(request.object)) {
      for (const tpl of REQUEST_TEMPLATES) {
        for (const frame of tpl.frames) {
          const text = frame.replace('{obj}', obj.text);
          const kinds: VariantKind[] = [...tpl.kinds];
          if (obj.lexical) kinds.push('lexical');
          variants.push({
            text,
            formality: tpl.formality,
            kinds,
            preservesIntent: true,
            requiresReview: true,
          });
        }
      }
    }
  } else {
    for (const v of genericSynonymVariants(raw)) {
      variants.push({
        text: v.text,
        formality: 'neutral',
        kinds: v.kinds,
        preservesIntent: true,
        requiresReview: true,
      });
    }
  }

  // Identidad (frase original) como variante neutral de referencia.
  const identity: SentenceVariant = {
    text: raw,
    formality: 'neutral',
    kinds: [],
    preservesIntent: true,
    requiresReview: true,
  };

  const all = unique([identity, ...variants]);
  // Mantén la identidad primero y recorta respetando maxVariants.
  const deduped = [all[0], ...all.slice(1)];
  return deduped.slice(0, options.maxVariants);
}

// ---------------------------------------------------------------------------
// 2. Generador de distractores gramaticales
// ---------------------------------------------------------------------------

interface ErrorRule {
  errorType: GrammarErrorType;
  explanation: string;
  /** Devuelve la frase modificada (incorrecta) o null si no aplica. */
  apply: (sentence: string) => string | null;
}

/** Errores de preposición típicos del hablante hispano. */
const PREPOSITION_ERRORS: { correct: string; wrong: string; hint: string }[] = [
  { correct: 'interested in', wrong: 'interested on', hint: "se dice 'interested in'" },
  { correct: 'listen to', wrong: 'listen', hint: "'listen' requiere 'to'" },
  { correct: 'arrive at', wrong: 'arrive to', hint: "se dice 'arrive at'" },
  { correct: 'depends on', wrong: 'depends of', hint: "se dice 'depends on'" },
  { correct: 'ask for', wrong: 'ask to', hint: "se dice 'ask for'" },
  { correct: 'wait for', wrong: 'wait to', hint: "'wait' requiere 'for'" },
  { correct: 'look for', wrong: 'look to', hint: "'buscar' es 'look for'" },
  { correct: 'think about', wrong: 'think on', hint: "se dice 'think about'" },
  { correct: 'married to', wrong: 'married with', hint: "se dice 'married to'" },
  { correct: 'good at', wrong: 'good in', hint: "se dice 'good at'" },
];

/** Errores de concordancia sujeto-verbo (there is/are + 3ª persona has). */
const AGREEMENT_ERRORS: { correct: string; wrong: string; hint: string }[] = [
  { correct: 'there is', wrong: 'there are', hint: "sujeto singular usa 'there is'" },
  { correct: 'there are', wrong: 'there is', hint: "sujeto plural usa 'there are'" },
];

/** Participios irregulares → pasado simple (error 'I have went'). */
const IRREGULAR_PARTICIPLES: { participle: string; simplePast: string }[] = [
  { participle: 'seen', simplePast: 'saw' },
  { participle: 'gone', simplePast: 'went' },
  { participle: 'done', simplePast: 'did' },
  { participle: 'eaten', simplePast: 'ate' },
  { participle: 'taken', simplePast: 'took' },
  { participle: 'written', simplePast: 'wrote' },
  { participle: 'spoken', simplePast: 'spoke' },
  { participle: 'drunk', simplePast: 'drank' },
  { participle: 'broken', simplePast: 'broke' },
  { participle: 'chosen', simplePast: 'chose' },
  { participle: 'come', simplePast: 'came' },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePhrase(sentence: string, from: string, to: string): string {
  // Preserva la mayúscula inicial de la coincidencia (p. ej. "There are" → "There is").
  return sentence.replace(new RegExp(escapeRegExp(from), 'i'), (match) =>
    /^[A-Z]/.test(match) ? to.charAt(0).toUpperCase() + to.slice(1) : to,
  );
}

/** Construye la frase con el error y el resto de mayúsculas intacto. */
function buildDistractor(
  errorType: GrammarErrorType,
  correct: string,
  wrong: string,
  explanation: string,
): Distractor {
  return {
    text: wrong,
    errorType,
    explanation,
    correctReference: correct,
    plausible: true,
    requiresReview: true,
  };
}

const ERROR_RULES: ErrorRule[] = [
  // Preposiciones
  ...PREPOSITION_ERRORS.map(
    (e): ErrorRule => ({
      errorType: 'preposition',
      explanation: `Preposición incorrecta: ${e.hint}.`,
      apply: (s) =>
        new RegExp(escapeRegExp(e.correct), 'i').test(s)
          ? replacePhrase(s, e.correct, e.wrong)
          : null,
    }),
  ),
  // Concordancia
  ...AGREEMENT_ERRORS.map(
    (e): ErrorRule => ({
      errorType: 'agreement',
      explanation: `Error de concordancia: ${e.hint}.`,
      apply: (s) =>
        new RegExp(escapeRegExp(e.correct), 'i').test(s)
          ? replacePhrase(s, e.correct, e.wrong)
          : null,
    }),
  ),
  // "has/have/had" + participio irregular → pasado simple
  {
    errorType: 'verb_form',
    explanation:
      'Forma verbal incorrecta: tras "have/has/had" se usa el participio, no el pasado simple.',
    apply: (s) => {
      for (const irr of IRREGULAR_PARTICIPLES) {
        const re = new RegExp(`\\b(have|has|had)\\s+${irr.participle}\\b`, 'i');
        if (re.test(s)) {
          return s.replace(re, (_m, aux: string) => `${aux} ${irr.simplePast}`);
        }
      }
      return null;
    },
  },
  // Orden de palabras: inversión incorrecta en pregunta indirecta
  {
    errorType: 'word_order',
    explanation:
      'Orden de palabras: en la pregunta indirecta el verbo va después del sujeto (no se invierte).',
    apply: (s) => {
      const re = /\b(where|what time|how much|how many|when|which)\s+([a-z][a-z' -]*?)\s+(is|are|was|were)\b/i;
      const m = s.match(re);
      if (!m) return null;
      const [full, wh, thing, verb] = m;
      return s.replace(full, `${wh} ${verb} ${thing}`);
    },
  },
  // Artículo a/an incorrecto ante vocal
  {
    errorType: 'article',
    explanation: 'Artículo incorrecto: "a" ante sonido vocálico se escribe "an" (y viceversa).',
    apply: (s) => {
      const wrongA = s.replace(/\ban\s+([aeiou])/gi, (_m, v: string) => `a ${v}`);
      if (wrongA !== s) return wrongA;
      const wrongAn = s.replace(/\ba\s+([bcdfghjklmnpqrstvwxyz])/gi, (_m, c: string) => `an ${c}`);
      return wrongAn !== s ? wrongAn : null;
    },
  },
];

/**
 * Genera distractores gramaticales verosímiles para una frase correcta.
 *
 * Recorre las reglas de error (preposición, concordancia, artículo, orden y
 * forma verbal) y devuelve hasta `maxDistractors` opciones, priorizando la
 * diversidad de tipo de error y evitando duplicados.
 */
export function generateDistractors(correct: string, opts?: GenerationOptions): Distractor[] {
  const options = GenerationOptionsSchema.parse(opts ?? {});
  const sentence = (correct ?? '').trim();
  if (!sentence || options.maxDistractors === 0) return [];

  const candidates: Distractor[] = [];
  for (const rule of ERROR_RULES) {
    const wrong = rule.apply(sentence);
    if (wrong && wrong.trim().toLowerCase() !== sentence.toLowerCase()) {
      candidates.push(buildDistractor(rule.errorType, sentence, wrong, rule.explanation));
    }
  }

  // Diversidad: un distractor por tipo de error primero, luego rellenar.
  const byType = new Map<GrammarErrorType, Distractor>();
  const extras: Distractor[] = [];
  for (const c of candidates) {
    if (!byType.has(c.errorType)) byType.set(c.errorType, c);
    else extras.push(c);
  }

  const ordered = [...byType.values(), ...extras];
  return unique(ordered).slice(0, options.maxDistractors);
}

// ---------------------------------------------------------------------------
// 3. Composición: opciones de selección múltiple
// ---------------------------------------------------------------------------

export interface MultipleChoiceResult {
  correct: string;
  /** Opciones mezcladas (la correcta entre distractores). */
  options: string[];
  distractors: Distractor[];
}

/**
 * Compone un set de opciones de múltiple elección a partir de una frase
 * correcta: mezcla la respuesta correcta con los distractores generados de
 * forma determinista según `opts.seed`.
 */
export function buildMultipleChoice(
  correct: string,
  opts?: GenerationOptions,
): MultipleChoiceResult {
  const options = GenerationOptionsSchema.parse(opts ?? {});
  const sentence = (correct ?? '').trim();
  const distractors = generateDistractors(sentence, options);
  const shuffled = seededShuffle([sentence, ...distractors.map((d) => d.text)], options.seed ?? 0);
  return { correct: sentence, options: shuffled, distractors };
}

/** Proveedor por defecto: motor de reglas determinista. */
export const aiContentGenerator: AiContentGeneratorProvider = {
  generateVariants: (source, opts) => generateVariants(source, opts),
  generateDistractors: (correct, opts) => generateDistractors(correct, opts),
};