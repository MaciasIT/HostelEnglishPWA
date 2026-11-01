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
  | 'maintenance'
  | 'overbooking'
  | 'tourist_directions'
  | 'order_taking'
  | 'wine_recommendation'
  | 'cold_food_complaint'
  | 'split_bill'
  | 'terrace_rush'
  | 'tapas_allergens'
  | 'specialty_coffee'
  | 'tips_payment'
  | 'iron_crib_request'
  | 'lost_item'
  | 'cleaning_schedule'
  | 'breakage_report'
  | 'elevator_breakdown'
  | 'bathroom_leak'
  | 'power_outage'
  | 'keycard_lock';

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
  overbooking: {
    key: 'overbooking',
    title: 'Overbooking: no hay habitación disponible',
    persona: 'Cliente alemán directo, molesto porque llega con reserva confirmada.',
    situation:
      'El hotel está completo por overbooking. El alumno debe disculparse, ofrecer alojamiento alternativo y compensar al huésped.',
  },
  tourist_directions: {
    key: 'tourist_directions',
    title: 'Indicaciones turísticas en recepción',
    persona: 'Turista canadiense curioso que quiere aprovechar el día en la ciudad.',
    situation:
      'El cliente pide recomendaciones y cómo llegar a la catedral y al casco antiguo. El alumno debe dar indicaciones claras.',
  },
  order_taking: {
    key: 'order_taking',
    title: 'Toma de comanda',
    persona: 'Cliente estadounidense relajado que pide con muchas dudas.',
    situation:
      'El cliente está listo para pedir y duda entre varios platos. El alumno debe tomar la comanda completa y confirmarla.',
  },
  wine_recommendation: {
    key: 'wine_recommendation',
    title: 'Recomendación de vinos',
    persona: 'Cliente francés aficionado al vino, exigente pero amable.',
    situation:
      'El cliente pide un vino para acompañar pescado y carne. El alumno debe recomendar y describir vinos de la carta.',
  },
  cold_food_complaint: {
    key: 'cold_food_complaint',
    title: 'Queja por comida fría',
    persona: 'Cliente británico educado pero visiblemente contrariado.',
    situation:
      'El plato principal llega frío. El alumno debe disculparse, retirar el plato y ofrecer una solución rápida.',
  },
  split_bill: {
    key: 'split_bill',
    title: 'Cobro con división de cuenta',
    persona: 'Grupo de cuatro amigos que quiere dividir la cuenta de formas distintas.',
    situation:
      'El grupo quiere pagar por separado, uno en efectivo y otros con tarjeta. El alumno debe gestionar el cobro.',
  },
  terrace_rush: {
    key: 'terrace_rush',
    title: 'Servicio en terraza con prisa',
    persona: 'Cliente italiano impaciente con muy poco tiempo antes de su tren.',
    situation:
      'La terraza está llena y el cliente tiene prisa. El alumno debe tomar el pedido rápido y dar un tiempo realista.',
  },
  tapas_allergens: {
    key: 'tapas_allergens',
    title: 'Alérgenos en tapas',
    persona: 'Cliente irlandés alérgico al marisco y a la lactosa.',
    situation:
      'El cliente quiere tapear pero debe evitar marisco y lactosa. El alumno debe informar de los alérgenos y sugerir opciones seguras.',
  },
  specialty_coffee: {
    key: 'specialty_coffee',
    title: 'Cafés especiales',
    persona: 'Cliente australiano amante del café de especialidad.',
    situation:
      'El cliente pregunta por tipos de café, leches y tamaños. El alumno debe explicar la carta y preparar el pedido correcto.',
  },
  tips_payment: {
    key: 'tips_payment',
    title: 'Cobro y propinas',
    persona: 'Cliente estadounidense acostumbrado a dejar propina en todos sitios.',
    situation:
      'El cliente paga con tarjeta y quiere añadir propina. El alumno debe cobrar y explicar cómo funciona la propina en España.',
  },
  iron_crib_request: {
    key: 'iron_crib_request',
    title: 'Solicitud de plancha y cuna',
    persona: 'Huésped con un bebé que necesita equipamiento extra.',
    situation:
      'El huésped pide una plancha y una cuna para su habitación. El alumno debe gestionar la petición y dar plazos.',
  },
  lost_item: {
    key: 'lost_item',
    title: 'Objeto olvidado en habitación',
    persona: 'Cliente británico apurado que acaba de dejar el hotel.',
    situation:
      'El cliente llama porque olvidó un objeto en su habitación. El alumno debe tomar los datos y explicar el procedimiento de objetos perdidos.',
  },
  cleaning_schedule: {
    key: 'cleaning_schedule',
    title: 'Mantenimiento de la limpieza',
    persona: 'Cliente estadounidense que quiere tranquilidad durante su estancia.',
    situation:
      'El cliente pregunta por el horario de limpieza y solicita que no se entre en su habitación hoy. El alumno debe acordar un horario.',
  },
  breakage_report: {
    key: 'breakage_report',
    title: 'Reporte de rotura',
    persona: 'Huésped avergonzado que ha roto algo de la habitación.',
    situation:
      'El huésped rompe una lámpara y lo comunica. El alumno debe tranquilizarlo, registrar la rotura y explicar el procedimiento.',
  },
  elevator_breakdown: {
    key: 'elevator_breakdown',
    title: 'Avería de ascensor',
    persona: 'Cliente mayor atrapado en el ascensor, nervioso.',
    situation:
      'El ascensor se ha detenido con un huésped dentro. El alumno debe tranquilizarlo y coordinar la ayuda.',
  },
  bathroom_leak: {
    key: 'bathroom_leak',
    title: 'Fuga en el baño',
    persona: 'Cliente preocupado por el agua en el suelo.',
    situation:
      'Hay una fuga bajo el lavabo del baño. El alumno debe registrar la avería y ofrecer una solución inmediata.',
  },
  power_outage: {
    key: 'power_outage',
    title: 'Corte de luz en la habitación',
    persona: 'Cliente tranquilo pero desorientado en una habitación a oscuras.',
    situation:
      'Se ha ido la luz en la habitación. El alumno debe indicar cómo comprobarlo, enviar a alguien y ofrecer una alternativa.',
  },
  keycard_lock: {
    key: 'keycard_lock',
    title: 'Cambio de cerradura electrónica',
    persona: 'Cliente cansado cuya tarjeta no abre la puerta.',
    situation:
      'La tarjeta no abre la cerradura electrónica. El alumno debe verificar la identidad, reprogramar la tarjeta o cambiar la cerradura.',
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