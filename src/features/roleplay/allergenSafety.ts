/**
 * Guardas de seguridad para los escenarios de alérgenos PM-03.
 *
 * Heurísticas deterministas y locales (sin LLM) compartidas por el respondedor
 * offline y el verificador de objetivo. Son conservadoras: ante la duda marcan
 * la frase como afirmación de seguridad no verificada.
 */

import { normalizeText } from '@/utils/normalize';

/** Escenarios PM-03 en los que no se puede garantizar seguridad alimentaria. */
export const ALLERGEN_SCENARIO_KEYS: readonly string[] = [
  'pm03_nut_allergy',
  'pm03_coeliac',
  'pm03_shellfish_cross_contact',
  'pm03_anaphylaxis_112',
];

export function isAllergenScenario(key: string): boolean {
  return ALLERGEN_SCENARIO_KEYS.includes(key);
}

const NEGATION = /\b(not|isnt|arent|cant|cannot|wont|dont|doesnt|never|unable|unsafe|no)\b/;
const CONFIRMATION =
  /\b(if|once|until|unless|whether|confirmed|confirms|verified|verifies|checked with)\b/;

const ASSERTION_PATTERNS: RegExp[] = [
  /\b(is|are|its|thats|this is|that is|it is|they are)\s+(completely |totally |absolutely |perfectly |definitely |100 |100 percent )?(safe|suitable|fine|ok|okay|nut free|gluten free|shellfish free|allergen free)\b/,
  /\b(i|we|chef|kitchen)\s+(can |will |do )?(guarantee|promise|assure)\b/,
  /\bno (nuts|traces|gluten|shellfish|risk|cross contamination|cross contact)\b/,
  /\b(free from|free of|without any) (nuts|gluten|shellfish|traces)\b/,
  /\b(dont|do not|no need to) worry\b/,
  /\bsafe (to eat|for you|for your)\b/,
];

/**
 * `true` si el texto del alumno afirma que un plato es seguro/apto/sin trazas
 * sin condicionarlo ni negarlo (p. ej. "It is safe", "I guarantee", "no nuts").
 * Frases como "I cannot guarantee it is safe" o "once the kitchen confirms it
 * is safe" NO cuentan como afirmación.
 */
export function assertsUnverifiedSafety(text: string): boolean {
  const sentences = (text || '').split(/[.!?;\n]+/);
  for (const raw of sentences) {
    const s = normalizeText(raw);
    if (!s) continue;
    for (const pattern of ASSERTION_PATTERNS) {
      const m = pattern.exec(s);
      if (!m) continue;
      const before = s.slice(0, m.index);
      const lastWords = before.split(' ').slice(-3).join(' ');
      // "no X" es en sí la afirmación; en el resto, una negación previa la anula.
      if (NEGATION.test(lastWords)) continue;
      if (CONFIRMATION.test(before)) continue;
      return true;
    }
  }
  return false;
}

/** `true` si el alumno ofrece tratamiento/diagnóstico médico (prohibido). */
export function givesMedicalAdvice(text: string): boolean {
  const s = normalizeText(text || '');
  return /\b(adrenaline|epinephrine|epipen|antihistamine|medication|medicine|pill|tablet|inhaler|you have anaphylaxis|you are having anaphylaxis)\b/.test(
    s,
  );
}

/** `true` si el alumno activa el protocolo de emergencia (112/ambulancia). */
export function mentionsEmergencyCall(text: string): boolean {
  return /\b(112|ambulance|emergency)\b/.test(normalizeText(text || ''));
}

/** `true` si el alumno menciona avisar al responsable. */
export function mentionsManager(text: string): boolean {
  return /\b(manager|supervisor|person in charge)\b/.test(normalizeText(text || ''));
}

/** `true` si el alumno acude a cocina/chef o pide confirmar. */
export function mentionsKitchenCheck(text: string): boolean {
  return /\b(kitchen|chef|confirm|ingredients|verify)\b/.test(normalizeText(text || ''));
}

/** Respuestas del cliente por escenario PM-03 (inglés; nunca afirman seguridad). */
export function generateAllergenReply(key: string, userMessage: string): string {
  if (givesMedicalAdvice(userMessage)) {
    return 'Please do not give me any medicine or tell me what I have. Call 112 and get the manager now!';
  }
  if (assertsUnverifiedSafety(userMessage)) {
    return 'How can you be sure? Please do not guarantee anything until the kitchen has confirmed the ingredients and any cross-contamination in the protocol.';
  }
  const emergency = mentionsEmergencyCall(userMessage);
  const manager = mentionsManager(userMessage);

  switch (key) {
    case 'pm03_anaphylaxis_112':
      if (emergency) {
        return 'Yes, please call 112 now and tell the manager. Please stay with me, I can hardly breathe.';
      }
      if (manager) {
        return 'Please hurry, my throat is closing! The manager must call 112 right now.';
      }
      return 'My throat feels tighter and I am struggling to breathe. Please get the manager and call 112 immediately!';

    case 'pm03_shellfish_cross_contact':
      if (emergency) {
        return 'Yes, please call 112 now. My partner is getting a reaction, please stay with us and bring the manager.';
      }
      if (manager || mentionsKitchenCheck(userMessage)) {
        return 'Thank you. Please stop serving this table until the kitchen and the manager have confirmed what happened. If my partner has a reaction, call 112 straight away.';
      }
      return 'Please stop serving our table and tell the kitchen and the manager right now. If my partner starts to react, call 112 immediately.';

    case 'pm03_coeliac':
      if (mentionsKitchenCheck(userMessage)) {
        return 'Thank you. Please do not recommend or serve anything until the kitchen confirms it is prepared separately. If they cannot confirm, I will not eat it.';
      }
      return 'I need to be certain. Could you ask the kitchen to confirm the ingredients and cross-contamination before you recommend anything?';

    case 'pm03_nut_allergy':
    default:
      if (mentionsKitchenCheck(userMessage)) {
        return 'Thank you. Please do not serve this dish until the kitchen confirms the ingredients and cross-contamination. If they cannot confirm, I will not eat it.';
      }
      return 'I need to be certain. Could you ask the kitchen to confirm the ingredients before you recommend anything?';
  }
}
