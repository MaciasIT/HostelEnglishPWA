import { CategoryScore, Certification } from '@/store/types';

/**
 * Role metadata mapping.
 */
export const ROLE_META: Record<string, { label: string; title: string }> = {
  recepcion: {
    label: 'Recepción Hotelera',
    title: 'Certificación Inglés Profesional: Recepción Hotelera A2/B1',
  },
  restaurante: {
    label: 'Restaurante / Servicio de Mesa',
    title: 'Certificación Inglés Profesional: Restaurante y Servicio A2/B1',
  },
  limpieza: {
    label: 'Limpieza y Pisos',
    title: 'Certificación Inglés Profesional: Limpieza y Pisos A2/B1',
  },
  mantenimiento: {
    label: 'Mantenimiento',
    title: 'Certificación Inglés Profesional: Mantenimiento A2/B1',
  },
  bar: {
    label: 'Barra y Cafetería',
    title: 'Certificación Inglés Profesional: Barra y Cafetería A2/B1',
  },
};

export type ExamQuestionResult = {
  phraseId: string;
  category: string | undefined;
  correct: boolean;
  responseTimeMs: number;
};

/**
 * Calculates category breakdowns from per-question results.
 */
export function calculateCategoryScores(results: ExamQuestionResult[]): CategoryScore[] {
  const grouped: Record<string, { total: number; correct: number }> = {};

  for (const r of results) {
    const cat = r.category || 'General';
    if (!grouped[cat]) grouped[cat] = { total: 0, correct: 0 };
    grouped[cat].total++;
    if (r.correct) grouped[cat].correct++;
  }

  return Object.entries(grouped)
    .map(([category, { total, correct }]) => ({
      category,
      total,
      correct,
      accuracy: total > 0 ? correct / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Generates a short verification code from the certification data.
 */
export function generateVerificationCode(cert: Partial<Certification>): string {
  const seed = `${cert.studentName}-${cert.role}-${cert.examDate}-${cert.score}-${cert.total}`;
  // Simple hash-like code: take first 8 chars of a base36-ish encoding
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit int
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `HE-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Calculates the competency index (0-100).
 * Formula: 60% accuracy + 40% speed score.
 * Speed score: 100 at < 2s avg, 0 at > 15s avg, linear interpolation.
 */
export function calculateCompetencyIndex(accuracy: number, avgResponseTimeMs: number): number {
  const accuracyScore = accuracy * 60;

  const avgSeconds = avgResponseTimeMs / 1000;
  const speedScore = avgSeconds <= 2
    ? 40
    : avgSeconds >= 15
      ? 0
      : 40 * (1 - (avgSeconds - 2) / 13);

  return Math.round(Math.max(0, Math.min(100, accuracyScore + speedScore)));
}

/**
 * Builds a complete Certification record.
 */
export function buildCertification({
  studentName,
  role,
  questionResults,
  passingThreshold = 0.7,
}: {
  studentName: string;
  role: 'recepcion' | 'restaurante' | 'limpieza' | 'mantenimiento' | 'bar';
  questionResults: ExamQuestionResult[];
  passingThreshold?: number;
}): Certification {
  const total = questionResults.length;
  const correct = questionResults.filter(r => r.correct).length;
  const accuracy = total > 0 ? correct / total : 0;
  const avgResponseTimeMs = total > 0
    ? questionResults.reduce((sum, r) => sum + r.responseTimeMs, 0) / total
    : 0;
  const categoryScores = calculateCategoryScores(questionResults);
  const competencyIndex = calculateCompetencyIndex(accuracy, avgResponseTimeMs);
  const passed = accuracy >= passingThreshold;
  const examDate = new Date().toISOString().split('T')[0];
  const roleLabel = ROLE_META[role]?.label || role;

  const base: Partial<Certification> = {
    studentName,
    role,
    roleLabel,
    examDate,
    score: correct,
    total,
    accuracy,
    avgResponseTimeMs: Math.round(avgResponseTimeMs),
    categoryScores,
    competencyIndex,
    passed,
  };

  return {
    id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    verificationCode: generateVerificationCode(base),
    ...base,
  } as Certification;
}
