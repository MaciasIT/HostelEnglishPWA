/**
 * Generador procedural de escenarios de roleplay de hostelería (FD-03).
 *
 * El alumno no debe quedar limitado a los 20+ escenarios fijos del catálogo
 * (FC-10). Este módulo combina tres ejes independientes y produce situaciones
 * nuevas **bajo demanda**:
 *
 *   - `department`      → el puesto donde trabaja el alumno (sala, barra…).
 *   - `customerProfile` → el cliente que adopta la IA (negocios, familia…).
 *   - `plotTwist`       → el giro de trama a resolver (alergia, plato frío…).
 *
 * El resultante es un `ProceduralScenario` autocontenido con su `systemPrompt`
 * y su `openingLine` determinista, listo para alimentar el motor de roleplay.
 *
 * Diseño:
 *   - **Determinista y offline-first**: dado un `seed`, la salida es siempre la
 *     misma. La línea de apertura se templa sin red, así que el arranque nunca
 *     alucina (en la línea de FC-03/FC-10).
 *   - **Costura para el SLM local / streaming fallback**: `generateOpeningDialogue`
 *     enriquece la línea de apertura con el motor híbrido (WebLLM on-device o el
 *     cliente cloud de FC-08), degradando a la apertura determinista ante error.
 *   - **Independiente del catálogo fijo**: no depende de `RoleplayScenarioKey`;
 *     genera combinaciones nuevas (5 × 5 × 4 = 100) e ilimitadas por variación
 *     de seed/fraseo. Reutiliza las restricciones anti-alucinación de hostelería.
 */

import type { GenerateCallbacks } from '@/services/llm/localEngine';
import type {
  LLMChatMessage,
  LLMCompletionResult,
  LLMGenerateOptions,
} from '@/services/llm/llmTypes';

/* ------------------------------------------------------------------------- */
/* Ejes de generación                                                        */
/* ------------------------------------------------------------------------- */

/** Departamento o puesto que ejercita el alumno. */
export type ProceduralDepartment =
  | 'sala'
  | 'barra'
  | 'recepcion'
  | 'cocina'
  | 'pisos';

/** Perfil de cliente que adopta la IA. */
export type CustomerProfile =
  | 'business_rush'
  | 'family_kids'
  | 'anniversary_couple'
  | 'language_tourist'
  | 'undercover_critic';

/** Incidencia / giro de trama a resolver por el alumno. */
export type PlotTwist =
  | 'sudden_allergy'
  | 'cold_plate'
  | 'bill_error'
  | 'noisy_room';

export interface DepartmentDef {
  id: ProceduralDepartment;
  /** Etiqueta legible en español (UI). */
  labelEs: string;
  /** Frase en inglés para situar el puesto en el system prompt. */
  placeEn: string;
  /** Vocabulario base del departamento (B1-B2) que se espera del alumno. */
  vocabulary: string[];
}

export interface CustomerProfileDef {
  id: CustomerProfile;
  /** Etiqueta legible en español (UI). */
  labelEs: string;
  /** Persona que adopta la IA (en inglés). */
  persona: string;
  /** Instrucción de tono/ritmo del cliente (en inglés). */
  tone: string;
}

export interface PlotTwistDef {
  id: PlotTwist;
  /** Etiqueta legible en español (UI). */
  labelEs: string;
  /** Situación concreta a resolver (en inglés). */
  situation: string;
  /** Objetivo para el alumno (en español, se muestra como instrucción). */
  objective: string;
  /** Vocabulario clave del giro (B1-B2) en inglés. */
  vocabulary: string[];
  /** Línea de apertura determinista del cliente (en inglés). */
  openingLine: string;
}

export const PROCEDURAL_DEPARTMENTS: readonly DepartmentDef[] = [
  {
    id: 'sala',
    labelEs: 'Sala',
    placeEn: 'the restaurant dining room',
    vocabulary: ['table', 'order', 'menu', 'serve', 'dish', 'cutlery'],
  },
  {
    id: 'barra',
    labelEs: 'Barra',
    placeEn: 'the bar',
    vocabulary: ['drink', 'cocktail', 'tapas', 'glass', 'order', 'ice'],
  },
  {
    id: 'recepcion',
    labelEs: 'Recepción',
    placeEn: 'the front desk / reception',
    vocabulary: ['reservation', 'check-in', 'check-out', 'key', 'invoice', 'booking'],
  },
  {
    id: 'cocina',
    labelEs: 'Cocina',
    placeEn: 'the kitchen',
    vocabulary: ['ingredient', 'allergen', 'recipe', 'chef', 'preparation', 'plate'],
  },
  {
    id: 'pisos',
    labelEs: 'Pisos',
    placeEn: 'housekeeping / the floors',
    vocabulary: ['room', 'towel', 'clean', 'amenities', 'pillow', 'floor'],
  },
];

export const CUSTOMER_PROFILES: readonly CustomerProfileDef[] = [
  {
    id: 'business_rush',
    labelEs: 'Negocios con prisa',
    persona: 'a business traveller in a hurry — polite but clearly short on time',
    tone: 'Speak briskly and keep it short and to the point.',
  },
  {
    id: 'family_kids',
    labelEs: 'Familia con niños pequeños',
    persona: 'a guest travelling with two young children — warm but a little distracted',
    tone: 'Speak warmly and mention the children naturally.',
  },
  {
    id: 'anniversary_couple',
    labelEs: 'Pareja en aniversario romántico',
    persona:
      'a guest celebrating a wedding anniversary, hoping for a special touch',
    tone: 'Speak softly and expect a little extra care.',
  },
  {
    id: 'language_tourist',
    labelEs: 'Turista con dificultades de idioma',
    persona:
      'an international tourist with limited English, speaking slowly with simple words',
    tone: 'Use simple words and short sentences — you are a beginner speaker.',
  },
  {
    id: 'undercover_critic',
    labelEs: 'Crítico gastronómico encubierto',
    persona:
      'a polite but observant guest quietly assessing the service (in reality a secret critic)',
    tone: 'Speak politely but note every detail of the service.',
  },
];

export const PLOT_TWISTS: readonly PlotTwistDef[] = [
  {
    id: 'sudden_allergy',
    labelEs: 'Alergia repentina',
    situation:
      'The customer has just realised an unexpected, serious allergy and needs the worker to check ingredients or products urgently.',
    objective:
      'Identifica el alérgeno, revisa ingredientes o productos y ofrece una alternativa segura con total calma.',
    vocabulary: ['allergy', 'allergen', 'ingredients', 'nuts', 'gluten', 'safe'],
    openingLine:
      'Excuse me, I have a sudden allergy — could you check the ingredients for me, please?',
  },
  {
    id: 'cold_plate',
    labelEs: 'Plato frío',
    situation:
      "The customer's food has just arrived cold and they are visibly disappointed.",
    objective:
      'Pide disculpas, retira el plato y ofrece recalentarlo o sustituirlo de inmediato.',
    vocabulary: ['apologise', 'cold', 'replace', 'warm up', 'right away', 'dish'],
    openingLine:
      "I'm sorry, but my dish has arrived cold. Could you do something about it, please?",
  },
  {
    id: 'bill_error',
    labelEs: 'Error en la cuenta',
    situation: 'The customer notices a charge on the bill they did not order.',
    objective:
      'Revisa la cuenta, explica cada cargo y corrige el error sin discutir con el cliente.',
    vocabulary: ['bill', 'charge', 'mistake', 'correct', 'double-check', 'receipt'],
    openingLine:
      "Excuse me, I think there's a mistake on my bill. I didn't order this.",
  },
  {
    id: 'noisy_room',
    labelEs: 'Habitación ruidosa',
    situation: "The customer's room is too noisy and they cannot rest or sleep.",
    objective:
      'Escucha la queja, ofrece una habitación alternativa o una solución inmediata y confirma el plazo.',
    vocabulary: ['noise', 'quiet', 'move', 'room', 'apologise', 'alternative'],
    openingLine:
      "I'm sorry to bring this up, but my room is very noisy and I can't rest.",
  },
];

/** Nivel de vocabulario objetivo por defecto del aprendiz. */
const DEFAULT_LEVEL = 'B1-B2';

/* ------------------------------------------------------------------------- */
/* Modelo del escenario procedural                                            */
/* ------------------------------------------------------------------------- */

export interface ProceduralScenario {
  /** Identificador estable: `<department>-<profile>-<twist>` (reproducible). */
  id: string;
  department: ProceduralDepartment;
  customerProfile: CustomerProfile;
  plotTwist: PlotTwist;
  /** Título legible en español (UI). */
  title: string;
  /** Persona que adopta la IA (cliente). */
  persona: string;
  /** Situación concreta a resolver por el alumno. */
  situation: string;
  /** Objetivo para el alumno (español). */
  objective: string;
  /** Vocabulario esperado (departamento + giro). */
  expectedVocabulary: string[];
  /** Línea de apertura determinista del cliente. */
  openingLine: string;
  level: string;
  /** System prompt listo para el motor LLM. */
  systemPrompt: string;
}

/** Escenario sin el system prompt calculado (lo resuelve el constructor). */
export type ProceduralScenarioDraft = Omit<ProceduralScenario, 'systemPrompt'>;

/** Entrada del generador: todo opcional, se rellena por seed o al azar. */
export interface ProceduralGenerateOptions {
  department?: ProceduralDepartment;
  customerProfile?: CustomerProfile;
  plotTwist?: PlotTwist;
  /** Semilla entera para una selección determinista (tests / retos diarios). */
  seed?: number;
}

/* ------------------------------------------------------------------------- */
/* System prompt                                                              */
/* ------------------------------------------------------------------------- */

/** Restricciones base de hostelería (anti-alucinación, vocabulario B1-B2). */
const BASE_CONSTRAINTS: readonly string[] = [
  'You are a customer in a hotel/restaurant scenario. The user is a hotel worker in training.',
  'Speak ONLY in English (the user is a Spanish speaker learning hospitality English).',
  'Use B1-B2 hospitality vocabulary. Keep your sentences short and natural.',
  'Make at most ONE request or question per turn.',
  'Stay strictly inside the hospitality scenario. Do not leave the role.',
  'Never reveal that you are an AI assistant.',
  'Do not greet the user as a system or repeat their own words back.',
  'If the user is blocked for more than 8 seconds, offer one gentle hint in a single short sentence.',
];

/** Indexa un catálogo por `id` conservando el tipado del literal. */
function indexBy<K extends string, T extends { id: K }>(
  items: readonly T[],
): Record<K, T> {
  const map = {} as Record<K, T>;
  for (const item of items) map[item.id] = item;
  return map;
}

const DEPARTMENT_BY_ID = indexBy(PROCEDURAL_DEPARTMENTS);
const PROFILE_BY_ID = indexBy(CUSTOMER_PROFILES);
const TWIST_BY_ID = indexBy(PLOT_TWISTS);

/**
 * Construye el system prompt del escenario procedural. Es determinista: para un
 * mismo borrador produce siempre el mismo prompt.
 */
export function buildProceduralSystemPrompt(
  scenario: ProceduralScenarioDraft,
): string {
  const department = DEPARTMENT_BY_ID[scenario.department];
  const profile = PROFILE_BY_ID[scenario.customerProfile];
  const twist = TWIST_BY_ID[scenario.plotTwist];

  const lines = [
    ...BASE_CONSTRAINTS,
    `Vocabulary level: ${scenario.level}.`,
    `Setting: ${department.placeEn}.`,
    `Role (you, the customer): ${profile.persona}`,
    `Tone: ${profile.tone}`,
    `Situation: ${twist.situation}`,
    'Your goal is to act naturally so the user can practise resolving the situation.',
  ];

  return lines.join('\n');
}

/* ------------------------------------------------------------------------- */
/* RNG determinista                                                           */
/* ------------------------------------------------------------------------- */

/** RNG determinista (mulberry32) derivado de una semilla entera. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/* ------------------------------------------------------------------------- */
/* Generación                                                                 */
/* ------------------------------------------------------------------------- */

function buildScenario(
  department: DepartmentDef,
  profile: CustomerProfileDef,
  twist: PlotTwistDef,
): ProceduralScenario {
  const draft: ProceduralScenarioDraft = {
    id: `${department.id}-${profile.id}-${twist.id}`,
    department: department.id,
    customerProfile: profile.id,
    plotTwist: twist.id,
    title: `${department.labelEs} — ${profile.labelEs} con ${twist.labelEs.toLocaleLowerCase()}`,
    persona: profile.persona,
    situation: twist.situation,
    objective: twist.objective,
    expectedVocabulary: [...department.vocabulary, ...twist.vocabulary],
    openingLine: twist.openingLine,
    level: DEFAULT_LEVEL,
  };

  return { ...draft, systemPrompt: buildProceduralSystemPrompt(draft) };
}

/**
 * Genera un escenario procedural bajo demanda. Con ejes explícitos la salida
 * es fija; con `seed`, determinista y reproducible; sin `seed`, aleatoria.
 */
export function generateProceduralScenario(
  options: ProceduralGenerateOptions = {},
): ProceduralScenario {
  const rng =
    typeof options.seed === 'number' ? mulberry32(options.seed) : Math.random;

  const department =
    DEPARTMENT_BY_ID[options.department ?? pickOne(PROCEDURAL_DEPARTMENTS, rng).id];
  const profile =
    PROFILE_BY_ID[options.customerProfile ?? pickOne(CUSTOMER_PROFILES, rng).id];
  const twist =
    TWIST_BY_ID[options.plotTwist ?? pickOne(PLOT_TWISTS, rng).id];

  return buildScenario(department, profile, twist);
}

/** Devuelve todas las combinaciones canónicas (departamento × perfil × giro). */
export function generateAllProceduralScenarios(): ProceduralScenario[] {
  const scenarios: ProceduralScenario[] = [];
  for (const department of PROCEDURAL_DEPARTMENTS) {
    for (const profile of CUSTOMER_PROFILES) {
      for (const twist of PLOT_TWISTS) {
        scenarios.push(buildScenario(department, profile, twist));
      }
    }
  }
  return scenarios;
}

/** Número de combinaciones canónicas (5 × 5 × 4). */
export function countProceduralCombinations(): number {
  return (
    PROCEDURAL_DEPARTMENTS.length * CUSTOMER_PROFILES.length * PLOT_TWISTS.length
  );
}

/* ------------------------------------------------------------------------- */
/* Diálogo de apertura (SLM local o streaming fallback)                       */
/* ------------------------------------------------------------------------- */

/** Contrato mínimo del motor LLM que genera la línea de apertura. */
export interface DialogueEngine {
  generate(
    messages: LLMChatMessage[],
    callbacks?: GenerateCallbacks,
    options?: LLMGenerateOptions,
  ): Promise<LLMCompletionResult>;
}

/** Resultado de la generación de la línea de apertura. */
export interface GeneratedOpening {
  scenario: ProceduralScenario;
  openingLine: string;
  /** `llm` si la línea la produjo el motor; `deterministic` si degradó. */
  source: 'llm' | 'deterministic';
}

let defaultEnginePromise: Promise<DialogueEngine> | null = null;

/** Resuelve perezosamente el motor híbrido (WebLLM local ⇄ cloud) de FC-08. */
async function resolveDefaultEngine(): Promise<DialogueEngine> {
  if (!defaultEnginePromise) {
    defaultEnginePromise = import('@/services/llm/hybridEngine').then((mod) =>
      mod.getHybridLLMEngine(),
    );
  }
  return defaultEnginePromise;
}

/**
 * Genera la línea de apertura del cliente usando el SLM local o el fallback de
 * streaming. Si el motor falla (o devuelve una línea vacía/degradada), devuelve
 * la apertura determinista del escenario, de modo que el roleplay nunca arranca
 * sin diálogo.
 */
export async function generateOpeningDialogue(
  scenario: ProceduralScenario,
  engine?: DialogueEngine,
): Promise<GeneratedOpening> {
  const resolved = engine ?? (await resolveDefaultEngine());

  const messages: LLMChatMessage[] = [
    { role: 'system', content: scenario.systemPrompt },
    {
      role: 'user',
      content:
        'Begin the conversation as the customer with one short, natural first line about the situation.',
    },
  ];

  try {
    const result = await resolved.generate(messages, {}, {
      maxTokens: 64,
      temperature: 0.8,
    });
    const line = result.fullText.trim();
    if (line.length >= 5) {
      return { scenario, openingLine: line, source: 'llm' };
    }
  } catch {
    // Cualquier fallo del motor degrada a la apertura determinista.
  }

  return { scenario, openingLine: scenario.openingLine, source: 'deterministic' };
}