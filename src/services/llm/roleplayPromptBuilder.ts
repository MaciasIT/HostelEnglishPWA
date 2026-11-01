/**
 * Constructor de system prompts de roleplay para hostelería.
 *
 * El alumno ejerce de camarero/recepcionista; la IA adopta el rol de cliente.
 * Los prompts fuerzan vocabulario B1-B2, una sola petición por turno y
 * restricciones anti-alucinación (no salir del escenario, no revelar ser IA).
 *
 * FC-03 (motor de roleplay) reutiliza estos prompts para sus 5 escenarios.
 */

export type RoleplayScenarioKey =
  | 'checkin'
  | 'room_service'
  | 'complaint'
  | 'checkout'
  | 'restaurant'
  | 'bar'
  | 'maintenance';

export interface RoleplayScenario {
  key: RoleplayScenarioKey;
  /** Título legible en español. */
  title: string;
  /** Persona que adopta la IA (cliente). */
  persona: string;
  /** Situación concreta a resolver por el alumno. */
  situation: string;
}

export const ROLEPLAY_SCENARIOS: Record<RoleplayScenarioKey, RoleplayScenario> = {
  checkin: {
    key: 'checkin',
    title: 'Check-in tardío sin reserva confirmada',
    persona: 'Cliente británico formal, algo cansado tras un vuelo largo.',
    situation:
      'El cliente llega tarde por la noche y su reserva no aparece en el sistema. ' +
      'Quiere una habitación, pero el alumno debe verificar identidad y buscar disponibilidad.',
  },
  room_service: {
    key: 'room_service',
    title: 'Servicio de habitaciones',
    persona: 'Cliente estadounidense casual que pide algo fuera de carta.',
    situation:
      'El cliente llama a recepción para pedir room service; desea un plato que no está ' +
      'en el menú y el alumno debe ofrecer alternativas amablemente.',
  },
  complaint: {
    key: 'complaint',
    title: 'Queja por toallas y amenities',
    persona: 'Cliente británico educado pero claramente molesto.',
    situation:
      'El cliente se queja de que faltan toallas y amenities en la habitación. ' +
      'El alumno debe disculparse, ofrecer solución inmediata y mantener la compostura.',
  },
  checkout: {
    key: 'checkout',
    title: 'Check-out con factura',
    persona: 'Cliente internacional con prisa por coger un taxi al aeropuerto.',
    situation:
      'El cliente hace el check-out y detecta un cargo en la factura que no reconoce. ' +
      'El alumno debe revisar cargos, explicarlos y cobrar correctamente.',
  },
  restaurant: {
    key: 'restaurant',
    title: 'Cliente con alergias y restricciones',
    persona: 'Cliente con intolerancia al gluten y alergia a frutos secos.',
    situation:
      'El cliente pregunta por platos sin gluten en la carta; el alumno debe conocer ' +
      'los alérgenos y recomendar opciones seguras.',
  },
  bar: {
    key: 'bar',
    title: 'Pedido complejo de coctelería',
    persona: 'Cliente que pide un cóctel concreto y tapas locales recomendadas.',
    situation:
      'El cliente pide un cóctel clásico y desea recomendación de tapas locales. ' +
      'El alumno debe describir la carta y sugerir maridajes.',
  },
  maintenance: {
    key: 'maintenance',
    title: 'Aire acondicionado con fuga de agua',
    persona: 'Cliente preocupado por su habitación y con prisa por una solución técnica.',
    situation:
      'El aire acondicionado de la habitación gotea agua sobre el suelo. ' +
      'El alumno debe registrar la incidencia, tranquilizar al huésped y confirmar ' +
      'que un técnico acudirá a revisar la fuga.',
  },
};

/** Registro de voz y restricciones de formato según escenario. */
export interface RoleplayPromptOptions {
  /** Nivel de inglés objetivo del aprendiz (por defecto B1-B2). */
  level?: string;
  /** Si `true`, la IA ofrece una pista suave si el alumno se bloquea. */
  allowHints?: boolean;
  /** Idioma de la respuesta del cliente (por defecto inglés). */
  language?: 'en' | 'es' | 'eu';
}

const BASE_CONSTRAINTS = [
  'You are a customer in a hotel/restaurant scenario. The user is a hotel worker in training.',
  'Speak ONLY in the target language of the exchange.',
  'Use B1-B2 hospitality vocabulary. Keep your sentences short and natural.',
  'Make at most ONE request or question per turn.',
  'Stay strictly inside the restaurant/hotel scenario. Do not leave the role.',
  'Never reveal that you are an AI assistant.',
  'Do not greet the user as a system or repeat their own words back.',
];

/**
 * Construye el system prompt para un escenario de roleplay dado.
 * El resultado se envía como mensaje `system` al motor LLM.
 */
export function buildRoleplaySystemPrompt(
  scenario: RoleplayScenario,
  options: RoleplayPromptOptions = {},
): string {
  const { level = 'B1-B2', allowHints = true, language = 'en' } = options;

  const languageInstruction =
    language === 'en'
      ? 'Speak in English (the user is a Spanish speaker learning hospitality English).'
      : language === 'eu'
        ? 'Speak in Basque (Euskera).'
        : 'Habla en español.';

  const hintInstruction = allowHints
    ? 'If the user is blocked for more than 8 seconds, offer one gentle hint in a single short sentence.'
    : 'Do not offer hints; the user must resolve the situation unaided.';

  const lines = [
    ...BASE_CONSTRAINTS,
    `Vocabulary level: ${level}.`,
    languageInstruction,
    hintInstruction,
    '',
    `Role (you): ${scenario.persona}`,
    `Situation: ${scenario.situation}`,
    'Your goal is to act naturally so the user can practise resolving the situation.',
  ];

  return lines.join('\n');
}

/**
 * Construye los mensajes iniciales de una sesión de roleplay:
 * el system prompt seguido de un primer turno del cliente (opcional).
 */
export function buildRoleplayMessages(
  scenarioKey: RoleplayScenarioKey,
  options: RoleplayPromptOptions = {},
  openingLine?: string,
) {
  const scenario = ROLEPLAY_SCENARIOS[scenarioKey];
  const system = buildRoleplaySystemPrompt(scenario, options);
  const messages: { role: 'system' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
  ];
  if (openingLine) {
    messages.push({ role: 'assistant', content: openingLine });
  }
  return messages;
}