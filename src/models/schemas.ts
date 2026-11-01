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
  }),
  dailyActivity: z.record(z.string(), z.number().int().nonnegative()).default({}),
  examHistory: z.array(ExamEntrySchema).default([]),
  achievements: z.array(z.string()).default([]),
});

export type AppStateV1 = z.infer<typeof AppStateSchema>;
export type ProgressData = z.infer<typeof ProgressSchema>;
export type UserPrefs = z.infer<typeof PrefsSchema>;
