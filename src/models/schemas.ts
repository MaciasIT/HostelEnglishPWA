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
