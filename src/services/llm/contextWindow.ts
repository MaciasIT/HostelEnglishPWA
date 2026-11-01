/**
 * Control estricto de la ventana de contexto (tokens).
 *
 * WebLLM reserva el KV cache a partir de `context_window_size` al cargar el modelo,
 * así que NO debemos dejar que la conversación crezca sin límite. Este módulo:
 *  1. Estima tokens de un texto sin tokenizador (heurística conservadora).
 *  2. Recorta el historial de mensajes al presupuesto disponible,
 *     reservando margen para la respuesta del modelo.
 *
 * La estimación sobre-dimensiona deliberadamente (≈ 1 token / 3.5 caracteres
 * frente a los ~4 reales del inglés) para NO quedarse nunca cortos de KV cache.
 */

import type { LLMChatMessage } from './llmTypes';

/** Coste por mensaje en tokens cabecera (roles + <eot_id> de Llama 3.2). */
const MESSAGE_OVERHEAD_TOKENS = 4;

/**
 * Estimación conservadora de tokens para texto en inglés/español.
 * Sin acceso al tokenizador, asumimos ~3.5 chars/token (real ≈ 4 en inglés).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.5));
}

/** Estimación de tokens de un mensaje completo (contenido + sobrecarga). */
export function estimateMessageTokens(message: LLMChatMessage): number {
  return estimateTokens(message.content) + MESSAGE_OVERHEAD_TOKENS;
}

/**
 * Recorta una lista de mensajes para que quepa en `contextWindowSize` tokens,
 * reservando `reserveForOutput` tokens para la respuesta de salida.
 *
 * Reglas:
 *  - El mensaje `system` siempre se conserva (se recorta si excede por sí solo).
 *  - Se recorren los mensajes del MÁS reciente al más antiguo, acumulando tokens
 *    hasta agotar el presupuesto; el primer mensaje que no quepa se descarta.
 *  - Siempre se garantiza que el último turno del usuario sobrevive (se trunca
 *    su contenido si fuera necesario para no romper el diálogo).
 */
export function truncateMessagesToContextWindow(
  messages: LLMChatMessage[],
  contextWindowSize: number,
  reserveForOutput: number,
): LLMChatMessage[] {
  if (messages.length === 0) return [];

  const budget = Math.max(0, contextWindowSize - reserveForOutput);
  const system = messages.find((m) => m.role === 'system');

  const kept: LLMChatMessage[] = [];
  let used = 0;

  const add = (message: LLMChatMessage): boolean => {
    const cost = estimateMessageTokens(message);
    if (used + cost > budget) return false;
    kept.push(message);
    used += cost;
    return true;
  };

  // 1. System primero (ocupa presupuesto fijo).
  if (system) {
    used += estimateMessageTokens(system);
    kept.push(system);
  }

  // 2. Recorremos de más reciente a más antiguo (sin el system).
  const rest = messages.filter((m) => m !== system).slice().reverse();
  for (const message of rest) {
    if (!add(message)) break;
  }

  // 3. Garantizar el último turno del usuario.
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === 'user');
  if (lastUser && !kept.includes(lastUser)) {
    // Truncamos el contenido del usuario al presupuesto restante.
    const remaining = Math.max(1, budget - used - MESSAGE_OVERHEAD_TOKENS);
    const trunc = lastUser.content.slice(0, Math.max(1, remaining * 3.5)) + '…';
    kept.push({ role: lastUser.role, content: trunc });
  }

  // 4. Restaurar orden cronológico.
  const orderIndex = new Map<LLMChatMessage, number>();
  messages.forEach((m, i) => orderIndex.set(m, i));
  kept.sort((a, b) => {
    const ai = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });

  return kept;
}