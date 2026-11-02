import type { RoleplayScenario } from './schema';

/**
 * Generador procedural de respuestas del cliente para el modo de inferencia
 * offline/ligero (cuando WebGPU o el proxy remoto no están disponibles).
 *
 * Mantiene la coherencia contextual de la situación, el rol del cliente y
 * el departamento, permitiendo al alumno completar sus objetivos y practicar
 * el vocabulario técnico sin bloqueos ni caídas.
 */
export function generateCustomerReply(
  scenario: RoleplayScenario,
  userMessage: string,
  turnCount: number,
): string {
  const lower = userMessage.toLowerCase();
  const dept = scenario.department;

  // Detección de patrones de cortesía y acciones del alumno
  const isApology =
    lower.includes('sorry') ||
    lower.includes('apologise') ||
    lower.includes('apologize') ||
    lower.includes('pardon');

  const isChecking =
    lower.includes('check') ||
    lower.includes('look') ||
    lower.includes('moment') ||
    lower.includes('minute') ||
    lower.includes('second');

  const isAskingNameOrDetails =
    lower.includes('name') ||
    lower.includes('passport') ||
    lower.includes('reservation') ||
    lower.includes('booking') ||
    lower.includes('id') ||
    lower.includes('reference') ||
    lower.includes('voucher');

  const isOfferingSolution =
    lower.includes('replace') ||
    lower.includes('change') ||
    lower.includes('send') ||
    lower.includes('bring') ||
    lower.includes('complimentary') ||
    lower.includes('free of charge') ||
    lower.includes('discount') ||
    lower.includes('immediately') ||
    lower.includes('right away');

  // Si el alumno solicita datos o pasaporte
  if (isAskingNameOrDetails) {
    return 'Yes, certainly. My name is Alex Taylor, and here is my passport and the booking confirmation.';
  }

  // Si el alumno solicita un momento para comprobar el sistema
  if (isChecking) {
    return 'Of course, thank you for looking into this so quickly. Take your time.';
  }

  // Lógica específica por departamento
  switch (dept) {
    case 'recepcion':
      if (isApology || isOfferingSolution || turnCount >= 2) {
        return 'Thank you for finding a solution. Could you please give me the room key and let me know what time breakfast is served?';
      }
      return 'I see. Do you have any quiet rooms available for tonight, even if it requires an upgrade?';

    case 'restaurante':
      if (
        lower.includes('gluten') ||
        lower.includes('allergy') ||
        lower.includes('safe') ||
        lower.includes('recommend') ||
        lower.includes('menu') ||
        lower.includes('dish')
      ) {
        return 'That sounds wonderful and safe for my diet. Could you also please ask the chef to avoid cross-contamination in the kitchen?';
      }
      if (isOfferingSolution || isApology) {
        return 'Thank you for your prompt response. Could we also have a bottle of sparkling water while we wait?';
      }
      return 'Thank you. What would you recommend for dessert that is also dairy and nut free?';

    case 'bar':
      if (
        lower.includes('cocktail') ||
        lower.includes('tapas') ||
        lower.includes('pairing') ||
        lower.includes('martini') ||
        lower.includes('wine') ||
        lower.includes('beer')
      ) {
        return 'That pairing sounds delightful! I will take that cocktail and the tapas. Thank you for the suggestion.';
      }
      if (turnCount >= 2) {
        return 'Everything looks fantastic. Could you please add another drink to our tab whenever you can?';
      }
      return 'Sounds great! Roughly how long does it take to prepare?';

    case 'limpieza':
      if (isApology || isOfferingSolution) {
        return 'Thank you very much. Could you please confirm approximately what time the staff will bring them to my room?';
      }
      return 'Thank you. We are staying in room 204. Please let the housekeeping team know.';

    case 'mantenimiento':
      if (isApology || isOfferingSolution) {
        return 'Thank you so much. Please have the technician come by as soon as possible, as the room is very warm.';
      }
      return 'I understand. If the technician cannot repair it tonight, would it be possible to arrange a room change?';

    default:
      if (isApology || isOfferingSolution) {
        return 'Thank you very much for your help and understanding. I appreciate your quick assistance!';
      }
      if (turnCount >= 3) {
        return 'Everything is clear now, thank you so much for your great service!';
      }
      return 'Thank you. Could you please confirm how long that will take?';
  }
}
