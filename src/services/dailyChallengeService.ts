import type { PreferredRole, DailyChallenge, ChallengeStep } from '@/store/types';

// ---------------------------------------------------------------------------
// Tipos internos del catálogo
// ---------------------------------------------------------------------------
export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  role: PreferredRole;
  steps: Omit<ChallengeStep, 'completed'>[];
  xpReward: number;
  streakReward: number;
}

// ---------------------------------------------------------------------------
// Catálogo de retos diarios por departamento
// ---------------------------------------------------------------------------
export const CHALLENGE_CATALOG: ChallengeTemplate[] = [
  // ---- BAR ----------------------------------------------------------------
  {
    id: 'bar-001',
    title: 'Queja de alérgenos en Bar',
    description: 'Un cliente alega que su bebida contiene un alérgeno no declarado. Gestiona la situación de principio a fin.',
    role: 'bar',
    steps: [
      { id: 'b1-1', description: 'Escucha activamente y pide disculpas sin asumir culpabilidad.' },
      { id: 'b1-2', description: 'Consulta la ficha de ingredientes con tu encargado/a.' },
      { id: 'b1-3', description: 'Ofrece una alternativa segura o reembolso y documenta la incidencia.' },
    ],
    xpReward: 30,
    streakReward: 5,
  },
  {
    id: 'bar-002',
    title: 'Cóctel signature del día',
    description: 'Hoy te toca crear y promocionar el cóctel especial del día con vocabulario de coctelería avanzado.',
    role: 'bar',
    steps: [
      { id: 'b2-1', description: 'Describe los ingredientes y técnica de preparación en inglés.' },
      { id: 'b2-2', description: 'Persuade a dos clientes para que lo prueben con frases comerciales.' },
      { id: 'b2-3', description: 'Registra las ventas y elabora un mini-resumen en inglés.' },
    ],
    xpReward: 25,
    streakReward: 5,
  },
  {
    id: 'bar-003',
    title: 'Control de stock crítico',
    description: 'Quedan menos de tres botellas de ginebra y tres de ron. Comunica la incidencia y haz un pedido.',
    role: 'bar',
    steps: [
      { id: 'b3-1', description: 'Redacta un aviso de stock en inglés para el encargado.' },
      { id: 'b3-2', description: 'Llama al proveedor y confirma la entrega para mañana.' },
      { id: 'b3-3', description: 'Actualiza la hoja de inventario con unidades restantes.' },
    ],
    xpReward: 20,
    streakReward: 3,
  },
  {
    id: 'bar-004',
    title: 'Cliente VIP en terraza',
    description: 'Un cliente habitual de habla inglesa reserva la mejor mesa. Atiende su llegada con protocolo VIP.',
    role: 'bar',
    steps: [
      { id: 'b4-1', description: 'Saluda al cliente por su nombre y confirma la reserva.' },
      { id: 'b4-2', description: 'Recomienda opciones del menú en inglés con frases descriptivas.' },
      { id: 'b4-3', description: 'Despide con un "see you soon" personalizado y anota su preferencia.' },
    ],
    xpReward: 35,
    streakReward: 7,
  },
  // ---- RECEPCIÓN ----------------------------------------------------------
  {
    id: 'rec-001',
    title: 'Late check-in con queja',
    description: 'Un huésped llega a las 02:30 con una reserva para ayer. Revisa disponibilidad y gestiona la situación.',
    role: 'recepcion',
    steps: [
      { id: 'r1-1', description: 'Verifica la reserva en el sistema y pide disculpas por el malentendido.' },
      { id: 'r1-2', description: 'Explica la política de late check-in y ofrece una solución.' },
      { id: 'r1-3', description: 'Confirma la nueva fecha y actualiza el PMS con una nota.' },
    ],
    xpReward: 40,
    streakReward: 10,
  },
  {
    id: 'rec-002',
    title: 'Upgrade por aniversario',
    description: 'Unos huéspedes celebran su aniversario y preguntan por una habitación con mejores vistas.',
    role: 'recepcion',
    steps: [
      { id: 'r2-1', description: 'Felicitaciones iniciales en inglés y confirmación de la reserva original.' },
      { id: 'r2-2', description: 'Consulta disponibilidad de upgrades y expone opciones y precios.' },
      { id: 'r2-3', description: 'Procesa el upgrade y envía un mensaje de confirmación personalizado.' },
    ],
    xpReward: 30,
    streakReward: 8,
  },
  {
    id: 'rec-003',
    title: 'Pérdida de equipaje',
    description: 'Un huésped denuncia la pérdida de una maleta en la habitación. Inicia el protocolo.',
    role: 'recepcion',
    steps: [
      { id: 'r3-1', description: 'Toma declaración detallada en inglés: descripción, contenido, última ubicación.' },
      { id: 'r3-2', description: 'Consulta con housekeeping y seguridad y documenta hallazgos.' },
      { id: 'r3-3', description: 'Informa al huésped del estado de la investigación y ofrécete a ayudar con lo necesario.' },
    ],
    xpReward: 45,
    streakReward: 12,
  },
  // ---- RESTAURANTE --------------------------------------------------------
  {
    id: 'rest-001',
    title: 'Cliente celíaco en Restaurante',
    description: 'Un comensal con enfermedad celíaca solicita información sobre platos seguros en el menú.',
    role: 'restaurante',
    steps: [
      { id: 'rs1-1', description: 'Escucha la solicitud y muestra empatía y conocimiento de alergias.' },
      { id: 'rs1-2', description: 'Consulta la carta de alérgenos y recomienda platos seguros.' },
      { id: 'rs1-3', description: 'Comunica la petición a cocina y confirma por escrito al cliente.' },
    ],
    xpReward: 30,
    streakReward: 7,
  },
  {
    id: 'rest-002',
    title: 'Banquete corporativo express',
    description: 'Preparas un banquete de 40 comensales con menú predefinido. El cliente pide cambios de última hora.',
    role: 'restaurante',
    steps: [
      { id: 'rs2-1', description: 'Recibe los cambios y explica las limitaciones de servicio en inglés.' },
      { id: 'rs2-2', description: 'Confirma la actualización con cocina y servicio de sala.' },
      { id: 'rs2-3', description: 'Supervisa el servicio durante el evento y recoge feedback.' },
    ],
    xpReward: 35,
    streakReward: 10,
  },
  // ---- MANTENIMIENTO ------------------------------------------------------
  {
    id: 'mant-001',
    title: 'Fuga en habitación 214',
    description: 'Un huésped reporta una fuga de agua en el baño. Atiende la incidencia coordinando con recepción.',
    role: 'mantenimiento',
    steps: [
      { id: 'm1-1', description: 'Responde a la llamada, tranquiliza al huésped y confirma tiempos.' },
      { id: 'm1-2', description: 'Diagnostica y repara, documentando el trabajo realizado.' },
      { id: 'm1-3', description: 'Informa a recepción del cierre de la incidencia y propone una compensación si procede.' },
    ],
    xpReward: 40,
    streakReward: 10,
  },
  {
    id: 'mant-002',
    title: 'Revisión de climatización',
    description: 'El sistema de climatización del comedor da errores. Genera el parte de mantenimiento en inglés.',
    role: 'mantenimiento',
    steps: [
      { id: 'm2-1', description: 'Redacta el parte de incidencia en inglés: síntomas, zonas afectadas, urgencia.' },
      { id: 'm2-2', description: 'Contacta con el servicio técnico y programa la visita.' },
      { id: 'm2-3', description: 'Supervisa la intervención y registra la solución en el sistema.' },
    ],
    xpReward: 25,
    streakReward: 5,
  },
  // ---- LIMPIEZA -----------------------------------------------------------
  {
    id: 'limp-001',
    title: 'Turnover express VIP',
    description: 'El huésped de la suite presidencial hace el check-out en 30 minutos. Prepara la habitación a tiempo.',
    role: 'limpieza',
    steps: [
      { id: 'l1-1', description: 'Recibe el aviso de recepción y planifica el orden de tareas en inglés.' },
      { id: 'l1-2', description: 'Ejecuta la limpieza completa de la suite respetando el protocolo VIP.' },
      { id: 'l1-3', description: 'Confirma a recepción que la suite está lista y documenta el servicio.' },
    ],
    xpReward: 35,
    streakReward: 8,
  },
  {
    id: 'limp-002',
    title: 'Kit de amenities al detalle',
    description: 'Repón y verifica el kit de amenities en 20 habitaciones del piso 3 con vocabulario de inventario.',
    role: 'limpieza',
    steps: [
      { id: 'l2-1', description: 'Elabora la lista de repuesto en inglés: champú, gel, toallas, etc.' },
      { id: 'l2-2', description: 'Verifica existencias en el carro de limpieza y registra lo usado.' },
      { id: 'l2-3', description: 'Solicita recambio al almacén en inglés por escrito.' },
    ],
    xpReward: 20,
    streakReward: 5,
  },
];

// ---------------------------------------------------------------------------
// Utilidades deterministas
// ---------------------------------------------------------------------------

/**
 * Hash simple basado en FNV-1a para obtener un entero pseudo-aleatorio
 * pero determinista a partir de un string.
 */
export function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

/**
 * Selecciona una plantilla determinista combinando date + role.
 * La misma fecha y el mismo rol siempre producen el mismo reto.
 */
export function pickTemplateForDate(date: string, role: PreferredRole): ChallengeTemplate {
  const seed = `${date}:${role}`;
  const idx = fnv1aHash(seed) % CHALLENGE_CATALOG.length;
  return CHALLENGE_CATALOG[idx];
}

/**
 * Construye el objeto DailyChallenge completo para una fecha y rol dados.
 */
export function buildDailyChallenge(date: string, role: PreferredRole): DailyChallenge {
  const template = pickTemplateForDate(date, role);
  const challengeId = `${date}-${template.id}`;

  return {
    id: challengeId,
    date,
    role,
    title: template.title,
    description: template.description,
    steps: template.steps.map((s) => ({ ...s, completed: false })),
    xpReward: template.xpReward,
    streakReward: template.streakReward,
    completed: false,
    claimed: false,
  };
}

/**
 * Inicializa el estado del slice de retos diarios.
 */
export function getInitialDailyChallengeState() {
  return {
    currentChallenge: null as DailyChallenge | null,
    lastChallengeDate: '' as string,
  };
}
