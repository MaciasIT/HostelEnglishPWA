/**
 * Normaliza un texto para la comparación:
 * - Elimina espacios al principio y al final.
 * - Convierte a minúsculas.
 * - (Futuro) Podría eliminar signos de puntuación.
 * @param text El texto a normalizar.
 * @returns El texto normalizado.
 */
export const normalizeText = (text: string): string => {
  return text.trim().toLowerCase();
};
