/**
 * Acento / tipo de cliente del roleplay (FD-04).
 *
 * El acento se transmite al motor LLM como instrucción de estilo en el system
 * prompt (léxico y giros propios de cada variante) y ajusta ligeramente el
 * ritmo de la síntesis de voz. No cambia la voz TTS (no hay voces regionales
 * garantizadas en todos los dispositivos).
 */

export type ClientAccent = 'uk' | 'us' | 'au' | 'intl';

export interface ClientAccentDef {
  id: ClientAccent;
  flag: string;
  label: string;
  /** Descripción corta para la UI. */
  detail: string;
  /** Instrucción (en inglés) añadida al system prompt. */
  promptInstruction: string;
  /** Ritmo de TTS relativo (1 = normal). */
  speechRate: number;
}

export const CLIENT_ACCENTS: readonly ClientAccentDef[] = [
  {
    id: 'uk',
    flag: '🇬🇧',
    label: 'Británico',
    detail: 'Received Pronunciation',
    promptInstruction:
      'Accent/style: British English (Received Pronunciation). Use British vocabulary and spelling (lift, bill, mobile, "could I possibly…", "lovely").',
    speechRate: 1,
  },
  {
    id: 'us',
    flag: '🇺🇸',
    label: 'Estadounidense',
    detail: 'General American',
    promptInstruction:
      'Accent/style: General American English. Use American vocabulary (elevator, check, cell phone, "awesome", "I\'d like…").',
    speechRate: 1.05,
  },
  {
    id: 'au',
    flag: '🇦🇺',
    label: 'Australiano',
    detail: 'Australian English',
    promptInstruction:
      'Accent/style: Australian English. Relaxed, friendly tone with light Australian expressions (no worries, mate, reckon, heaps) without being hard to understand.',
    speechRate: 1.05,
  },
  {
    id: 'intl',
    flag: '🌍',
    label: 'Turista Internacional',
    detail: 'Acento no nativo',
    promptInstruction:
      'Accent/style: you are a non-native English speaker (international tourist). Use simple grammar, short sentences, occasional hesitations and small grammar slips, and sometimes ask the user to repeat or speak slowly.',
    speechRate: 0.9,
  },
];

export const DEFAULT_CLIENT_ACCENT: ClientAccent = 'uk';

export function getClientAccent(id: ClientAccent): ClientAccentDef {
  return CLIENT_ACCENTS.find((a) => a.id === id) ?? CLIENT_ACCENTS[0];
}
