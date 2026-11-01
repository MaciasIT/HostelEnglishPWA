/**
 * Catálogo completo de escenarios de roleplay (FC-10).
 *
 * Fuente de datos: `public/data/roleplays.json`, validado en tiempo de carga
 * contra `RoleplayScenarioSchema`. Si la carga o la validación fallan se usa
 * el catálogo canónico embebido (5 escenarios) para no romper la pantalla.
 */

import { CANONICAL_ROLEPLAY_SCENARIOS, resolveScenarioMeta } from './scenarios';
import { parseScenarios, type RoleplayDepartment, type RoleplayScenario } from './schema';

export const ROLEPLAY_CATALOG_URL = `${import.meta.env?.BASE_URL ?? '/'}data/roleplays.json`;

/** Carga y valida el catálogo; devuelve el canónico ante cualquier error. */
export async function loadRoleplayCatalog(
  fetcher: typeof fetch = fetch,
): Promise<RoleplayScenario[]> {
  try {
    const res = await fetcher(ROLEPLAY_CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseScenarios(await res.json());
  } catch {
    return CANONICAL_ROLEPLAY_SCENARIOS;
  }
}

/** Agrupa escenarios por departamento manteniendo el orden de aparición. */
export function groupByDepartment(
  scenarios: RoleplayScenario[],
): Map<RoleplayDepartment, RoleplayScenario[]> {
  const groups = new Map<RoleplayDepartment, RoleplayScenario[]>();
  for (const scenario of scenarios) {
    const list = groups.get(scenario.department) ?? [];
    list.push(scenario);
    groups.set(scenario.department, list);
  }
  return groups;
}

/** Filtro rápido por departamento y texto libre (título, objetivo, vocabulario). */
export function filterScenarios(
  scenarios: RoleplayScenario[],
  department: RoleplayDepartment | 'all',
  query: string,
): RoleplayScenario[] {
  const q = query.trim().toLowerCase();
  return scenarios.filter((scenario) => {
    if (department !== 'all' && scenario.department !== department) return false;
    if (!q) return true;
    const haystack = [
      resolveScenarioMeta(scenario.key).title,
      scenario.objective,
      ...scenario.expectedVocabulary,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
