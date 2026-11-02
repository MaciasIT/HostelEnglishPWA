import { z } from 'zod';

export type ReviewItem = {
  id: string;
  dueDate: string;
  difficulty: number;
  stability: number;
  retrievability: number;
  lapses: number;
  reps: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
};

export type ReviewItems = Record<string, ReviewItem>;

export const ReviewItemSchema: z.ZodType<ReviewItem> = z.object({
  id: z.string(),
  dueDate: z.string(),
  difficulty: z.number().min(1).max(10),
  stability: z.number().nonnegative(),
  retrievability: z.number().min(0).max(1),
  lapses: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  state: z.enum(['new', 'learning', 'review', 'relearning']),
});

export const ReviewItemsSchema = z.record(z.string(), ReviewItemSchema);

/**
 * Progress data: Mastery level (0-3) for phrases.
 * Keys are phrase IDs (must be strings).
 */
export const ProgressSchema = z.record(z.string(), z.number().int().min(0).max(3));

/**
 * Voice/Speech settings.
 */
export const VoiceSettingsSchema = z.object({
  voiceURI: z.string(),
  rate: z.number().min(0.1).max(5),
  pitch: z.number().min(0).max(2),
});

/**
 * User preferences.
 */
export const PrefsSchema = z.object({
  targetLanguage: z.enum(['en', 'eu']),
  theme: z.string(),
  audioSpeed: z.number().min(0.1).max(2),
  conversationSettings: z.record(z.string(), VoiceSettingsSchema),
  phraseSettings: VoiceSettingsSchema,
  preferredRole: z.enum(['bar', 'recepcion', 'restaurante', 'mantenimiento', 'limpieza']).default('bar'),
  selectedRole: z.enum(['recepcion', 'bar', 'restaurante', 'limpieza', 'mantenimiento', 'general']).nullable().optional(),
  studentName: z.string().default(''),
  hapticsEnabled: z.boolean().optional(),
});

/**
 * Exam result entry.
 */
export const ExamEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int().nonnegative(),
  total: z.number().int().positive(),
});

/**
 * Score breakdown by thematic category.
 */
export const CategoryScoreSchema = z.object({
  category: z.string(),
  total: z.number().int().positive(),
  correct: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
});

/**
 * Certification record for a role-based exam.
 */
export const CertificationSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  role: z.enum(['recepcion', 'restaurante', 'limpieza', 'mantenimiento', 'bar']),
  roleLabel: z.string(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  score: z.number().int(),
  total: z.number().int(),
  accuracy: z.number().min(0).max(1),
  avgResponseTimeMs: z.number().nonnegative(),
  categoryScores: z.array(CategoryScoreSchema),
  competencyIndex: z.number().min(0).max(100),
  passed: z.boolean(),
  verificationCode: z.string(),
});

export const CertificationsSchema = z.array(CertificationSchema);

/**
 * Complete Application State (Persistent parts).
 * This includes versioning for migration support.
 */
export const AppStateSchema = z.object({
  version: z.literal(1).default(1),
  progress: ProgressSchema.default({}),
  reviewItems: ReviewItemsSchema.default({}),
  prefs: PrefsSchema.default({
    targetLanguage: 'en',
    theme: 'light',
    audioSpeed: 1,
    conversationSettings: {},
    phraseSettings: {
      voiceURI: '',
      rate: 1,
      pitch: 1,
    },
    preferredRole: 'bar',
    studentName: '',
  }),
  dailyActivity: z.record(z.string(), z.number().int().nonnegative()).default({}),
  examHistory: z.array(ExamEntrySchema).default([]),
  achievements: z.array(z.string()).default([]),
  certifications: CertificationsSchema.default([]),
});

export type AppStateV1 = z.infer<typeof AppStateSchema>;
export type ProgressData = z.infer<typeof ProgressSchema>;
export type UserPrefs = z.infer<typeof PrefsSchema>;

/* ── Esquemas de datasets de contenido (FD-02) ──────────────────────── */

/**
 * Cadena IPA válida: símbolos fonéticos (ASCII + glifos IPA), marcas de acento
 * (`ˈ` primario, `ˌ` secundario), marca de longitud (`ː`) y espacios entre
 * palabras. Sin barras ni corchetes. Cubre tanto el RP británico como las
 * variantes US/AUS (p. ej. `oʊ`, `ər`) para el mapa de variantes.
 */
const IPA_PATTERN = /^[a-zæɑɒɔəɜɛɪʊʌθðʃʒŋɹɡʧʤːˈˌ ]+$/;

export const IpaSchema = z.string().min(1).regex(IPA_PATTERN);

/** Dominios temáticos PM-03 (distinto del departamento legado `categoria`). */
export const PhraseCategorySchema = z.enum(['Sumillería', 'Coctelería', 'Alérgenos']);
export type PhraseCategory = z.infer<typeof PhraseCategorySchema>;

/** Dificultad pedagógica de una frase: 1 (básica) a 3 (avanzada). */
export const PhraseDifficultySchema = z.number().int().min(1).max(3);

/**
 * Una frase trilingüe (es/en/eu) con transcripción IPA opcional.
 * `category` y `difficulty` son opcionales para no invalidar el dataset
 * histórico; los tests exigen ambos en las filas `source === 'PM-03'`.
 */
export const PhraseSchema = z.object({
  id: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  es: z.string().min(1),
  en: z.string().min(1),
  eu: z.string().nullable().optional(),
  categoria: z.string().optional(),
  category: PhraseCategorySchema.optional(),
  difficulty: PhraseDifficultySchema.optional(),
  ipa: IpaSchema.optional(),
  source: z.string().optional(),
});
export type PhraseData = z.infer<typeof PhraseSchema>;

/** Turno de diálogo de una conversación. */
export const ConversationTurnSchema = z.object({
  speaker: z.string().min(1),
  en: z.string().min(1),
  es: z.string().min(1),
  eu: z.string().nullable().optional(),
  audio: z.string().optional(),
  ipa: IpaSchema.optional(),
});

/** Conversación trilingüe completa con título y escenario traducidos. */
export const ConversationSchema = z.object({
  id: z.union([z.number().int().nonnegative(), z.string().min(1)]),
  title: z.string().min(1),
  title_eu: z.string().min(1),
  description: z.string().optional(),
  scenario: z.string().min(1),
  scenario_eu: z.string().min(1),
  categoria: z.string().optional(),
  participants: z.array(z.string().min(1)).min(1),
  dialogue: z.array(ConversationTurnSchema).min(1),
});
export type ConversationData = z.infer<typeof ConversationSchema>;

/** Término en una variante regional con su IPA. */
export const VariantTermSchema = z.object({
  term: z.string().min(1),
  ipa: IpaSchema,
});

/** Concepto con equivalencias UK / US / AUS. */
export const ConceptVariantSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  concept: z.string().min(1),
  category: z.string().optional(),
  uk: VariantTermSchema,
  us: VariantTermSchema,
  aus: VariantTermSchema,
  note: z.string().optional(),
});
export type ConceptVariantData = z.infer<typeof ConceptVariantSchema>;

/** Archivo de variantes regionales (`public/data/variants.json`). */
export const VariantsFileSchema = z.object({
  variants: z.array(ConceptVariantSchema).min(1),
});
