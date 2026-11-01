export type Phrase = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  categoria?: string;
  /** Transcripción fonética IPA (RP) de `en`. FD-02. */
  ipa?: string;
  /** Fuente de origen del dato (p. ej. "frases.pdf" o "FD-02"). */
  source?: string;
};

export type ConversationTurn = {
  speaker: string;
  en: string;
  es: string;
  eu?: string;
  audio?: string;
  /** Transcripción fonética IPA (RP) de `en`. FD-02. */
  ipa?: string;
};

export type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[];
  categoria?: string;
  participants: string[];
};

export type ExamResult = {
  date: string;
  score: number;
  total: number;
};

export type CategoryScore = {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type Certification = {
  id: string;
  studentName: string;
  role: 'recepcion' | 'restaurante' | 'limpieza' | 'mantenimiento' | 'bar';
  roleLabel: string;
  examDate: string;
  score: number;
  total: number;
  accuracy: number;
  avgResponseTimeMs: number;
  categoryScores: CategoryScore[];
  competencyIndex: number;
  passed: boolean;
  verificationCode: string;
};

export type ThemePreference = 'dark' | 'light' | 'auto';

export type AppPrefs = {
  targetLanguage: 'en' | 'eu';
  theme: ThemePreference;
  audioSpeed: number;
  conversationSettings: {
    [participant: string]: {
      voiceURI: string;
      rate: number;
      pitch: number;
    };
  };
  phraseSettings: {
    voiceURI: string;
    rate: number;
    pitch: number;
  };
  preferredRole: 'bar' | 'recepcion' | 'restaurante' | 'mantenimiento' | 'limpieza';
  /** Rol laboral elegido en onboarding. null/ausente = aún sin elegir. */
  selectedRole?: JobRole | null;
  studentName: string;
  /** Vibración háptica. Ausente = activada. */
  hapticsEnabled?: boolean;
};

export type LicenseDetails = {
  email: string;
  tier: 'pro';
  type: 'lifetime' | 'annual';
  issuedAt: number;
  expiresAt: number;
};

export type JobRole = 'recepcion' | 'bar' | 'restaurante' | 'limpieza' | 'mantenimiento' | 'general';

export type PreferredRole = 'bar' | 'recepcion' | 'restaurante' | 'mantenimiento' | 'limpieza';

export type ChallengeStep = {
  id: string;
  description: string;
  completed: boolean;
};

export type DailyChallenge = {
  id: string;
  date: string; // YYYY-MM-DD
  role: PreferredRole;
  title: string;
  description: string;
  steps: ChallengeStep[];
  xpReward: number;
  streakReward: number;
  completed: boolean;
  claimed: boolean;
};

/* ── Variantes regionales UK / US / AUS (FD-02) ─────────────────────── */

export type VariantRegion = 'uk' | 'us' | 'aus';

export type VariantTerm = {
  /** Término en la variante regional. */
  term: string;
  /** Transcripción fonética IPA del término. */
  ipa: string;
};

export type ConceptVariant = {
  /** Identificador estable del concepto (slug). */
  id: string;
  /** Glosa en español del concepto. */
  concept: string;
  /** Dominio: restaurante | bar | recepcion | cocina | limpieza | mantenimiento | general. */
  category?: string;
  uk: VariantTerm;
  us: VariantTerm;
  aus: VariantTerm;
  /** Aclaración opcional (diferencias de sentido o pronunciación). */
  note?: string;
};

export type VariantsFile = {
  variants: ConceptVariant[];
};
