import type { JobRole } from '@/store/types';

export const JOB_ROLES: { id: JobRole; label: string; emoji: string; desc: string }[] = [
  { id: 'recepcion', label: 'Recepción', emoji: '🛎', desc: 'Check-in, reservas y atención al huésped' },
  { id: 'bar', label: 'Bar', emoji: '🍹', desc: 'Bebidas, cócteles y servicio de barra' },
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽', desc: 'Sala, comandas y menús' },
  { id: 'limpieza', label: 'Limpieza', emoji: '🧹', desc: 'Pisos, habitaciones y lencería' },
  { id: 'mantenimiento', label: 'Mantenimiento', emoji: '🔧', desc: 'Averías, instalaciones y reparaciones' },
  { id: 'general', label: 'General', emoji: '🏨', desc: 'Todo el vocabulario sin filtrar' },
];

export const ROLE_LABELS: Record<JobRole, string> = Object.fromEntries(
  JOB_ROLES.map((r) => [r.id, r.label])
) as Record<JobRole, string>;

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Categorías (normalizadas) pertenecientes a cada departamento. 'general' = sin filtro. */
const ROLE_CATEGORIES: Record<Exclude<JobRole, 'general'>, string[]> = {
  recepcion: ['recepcion', 'harrera', 'quejas y reclamaciones', 'kexak', 'kexak eta erreklamazioak', 'general'],
  bar: ['bar', 'general'],
  restaurante: ['restaurante', 'jatetxea', 'room service', 'cocina', 'sukaldea', 'general'],
  limpieza: ['limpieza', 'general'],
  mantenimiento: ['mantenimiento', 'general'],
};

export function roleMatchesCategory(role: JobRole | null | undefined, categoria?: string | null): boolean {
  if (!role || role === 'general') return true;
  if (!categoria) return false;
  return ROLE_CATEGORIES[role].includes(norm(categoria));
}

export function filterByRole<T extends { categoria?: string | null }>(items: T[], role: JobRole | null | undefined): T[] {
  if (!role || role === 'general') return items;
  return items.filter((i) => roleMatchesCategory(role, i.categoria));
}
