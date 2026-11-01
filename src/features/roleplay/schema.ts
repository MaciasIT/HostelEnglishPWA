/**
 * Modelado de datos de escenarios de roleplay (FC-03).
 *
 * Define `RoleplayScenarioSchema`, el contrato Zod de un escenario jugable:
 * qué objetivo debe cumplir el alumno, qué vocabulario se espera que use,
 * cuántos turnos debe durar la conversación y la línea de apertura del cliente.
 *
 * La persona/situación del escenario (que alimentan el system prompt del LLM)
 * viven en `src/services/llm/roleplayPromptBuilder.ts` y NO se duplican aquí:
 * el `key` del escenario es la referencia de esa única fuente de verdad.
 */

import { z } from 'zod';
import { ROLEPLAY_SCENARIOS, type RoleplayScenarioKey } from '@/services/llm/roleplayPromptBuilder';

/** Claves válidas derivadas de la fuente única de personas/situaciones. */
const scenarioKeys = Object.keys(ROLEPLAY_SCENARIOS) as [
  RoleplayScenarioKey,
  ...RoleplayScenarioKey[],
];

/** Departamento o puesto que ejercita el alumno en el escenario. */
export const DepartmentSchema = z.enum([
  'recepcion',
  'restaurante',
  'bar',
  'limpieza',
  'mantenimiento',
]);
export type RoleplayDepartment = z.infer<typeof DepartmentSchema>;

/** Rango de turnos del alumno en los que se espera resolver la situación. */
export const TurnRangeSchema = z
  .object({
    min: z.number().int().min(2),
    max: z.number().int().min(3),
  })
  .refine((range) => range.max >= range.min, {
    message: 'max debe ser mayor o igual que min',
  });
export type RoleplayTurnRange = z.infer<typeof TurnRangeSchema>;

/**
 * Esquema del escenario de roleplay.
 *
 * Campos:
 *  - `key`: referencia al escenario base (persona/situación) del prompt builder.
 *  - `department`: departamento que practica el alumno.
 *  - `objective`: objetivo (en español) que el alumno debe lograr. Se muestra
 *    como instrucción y define los criterios de éxito.
 *  - `expectedVocabulary`: palabras/frases clave en inglés que se espera que
 *    el alumno utilice para resolver la situación (B1-B2).
 *  - `minVocabularyHits`: número mínimo de términos del vocabulario que deben
 *    aparecer en los turnos del alumno para considerar el objetivo cumplido.
 *  - `openingLine`: primera frase del cliente (determinista, evita que el LLM
 *    alucine en el arranque de la conversación).
 *  - `targetTurns`: rango de turnos objetivo (3-5 en el MVP).
 *  - `level`: nivel de vocabulario objetivo del aprendiz.
 */
export const RoleplayScenarioSchema = z.object({
  key: z.enum(scenarioKeys),
  department: DepartmentSchema,
  objective: z.string().min(10),
  expectedVocabulary: z.array(z.string().min(1)).min(1),
  minVocabularyHits: z.number().int().min(1),
  openingLine: z.string().min(5),
  targetTurns: TurnRangeSchema,
  level: z.string().default('B1-B2'),
});

export type RoleplayScenario = z.infer<typeof RoleplayScenarioSchema>;

/** Valida una lista de escenarios contra el esquema (devuelve los parseados). */
export function parseScenarios(input: unknown): RoleplayScenario[] {
  return z.array(RoleplayScenarioSchema).parse(input);
}