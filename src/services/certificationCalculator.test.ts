import { describe, it, expect } from 'vitest';
import {
  calculateCategoryScores,
  generateVerificationCode,
  calculateCompetencyIndex,
  buildCertification,
  ROLE_META,
  type ExamQuestionResult,
} from '@/services/certificationCalculator';

describe('certificationCalculator', () => {
  describe('calculateCategoryScores', () => {
    it('returns empty array for no results', () => {
      expect(calculateCategoryScores([])).toEqual([]);
    });

    it('groups results by category', () => {
      const results: ExamQuestionResult[] = [
        { phraseId: '1', category: 'reservas', correct: true, responseTimeMs: 3000 },
        { phraseId: '2', category: 'reservas', correct: false, responseTimeMs: 5000 },
        { phraseId: '3', category: 'quejas', correct: true, responseTimeMs: 2000 },
        { phraseId: '4', category: undefined, correct: false, responseTimeMs: 4000 },
      ];

      const scores = calculateCategoryScores(results);
      const reservas = scores.find(s => s.category === 'reservas');
      const quejas = scores.find(s => s.category === 'quejas');
      const general = scores.find(s => s.category === 'General');

      expect(reservas).toBeDefined();
      expect(reservas!.total).toBe(2);
      expect(reservas!.correct).toBe(1);
      expect(reservas!.accuracy).toBeCloseTo(0.5);

      expect(quejas).toBeDefined();
      expect(quejas!.total).toBe(1);
      expect(quejas!.correct).toBe(1);

      expect(general).toBeDefined();
      expect(general!.total).toBe(1);
    });

    it('sorts categories by total descending', () => {
      const results: ExamQuestionResult[] = [
        { phraseId: '1', category: 'cat_a', correct: true, responseTimeMs: 1000 },
        { phraseId: '2', category: 'cat_a', correct: true, responseTimeMs: 1000 },
        { phraseId: '3', category: 'cat_a', correct: true, responseTimeMs: 1000 },
        { phraseId: '4', category: 'cat_b', correct: true, responseTimeMs: 1000 },
      ];

      const scores = calculateCategoryScores(results);
      expect(scores[0].category).toBe('cat_a');
      expect(scores[1].category).toBe('cat_b');
    });
  });

  describe('generateVerificationCode', () => {
    it('generates a HE-XXXX-XXXX code', () => {
      const code = generateVerificationCode({
        studentName: 'Ana',
        role: 'recepcion',
        examDate: '2026-01-01',
        score: 8,
        total: 10,
      });
      expect(code).toMatch(/^HE-[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it('produces different codes for different inputs', () => {
      const code1 = generateVerificationCode({
        studentName: 'Ana',
        role: 'recepcion',
        examDate: '2026-01-01',
        score: 8,
        total: 10,
      });
      const code2 = generateVerificationCode({
        studentName: 'Luis',
        role: 'bar',
        examDate: '2026-01-01',
        score: 8,
        total: 10,
      });
      expect(code1).not.toBe(code2);
    });
  });

  describe('calculateCompetencyIndex', () => {
    it('returns 100 for perfect accuracy and instant answers', () => {
      expect(calculateCompetencyIndex(1.0, 500)).toBeCloseTo(100, 0);
    });

    it('returns 0 for zero accuracy', () => {
      expect(calculateCompetencyIndex(0, 15000)).toBe(0);
    });

    it('clamps to 0-100 range', () => {
      expect(calculateCompetencyIndex(1.0, 100)).toBeCloseTo(100, 0);
      expect(calculateCompetencyIndex(0, 20000)).toBe(0);
    });

    it('penalizes slow responses', () => {
      const fast = calculateCompetencyIndex(0.8, 2000);
      const slow = calculateCompetencyIndex(0.8, 10000);
      expect(fast).toBeGreaterThan(slow);
    });
  });

  describe('buildCertification', () => {
    const makeResults = (overrides: Partial<ExamQuestionResult>[] = []): ExamQuestionResult[] => [
      { phraseId: '1', category: 'reservas', correct: true, responseTimeMs: 3000, ...overrides[0] },
      { phraseId: '2', category: 'reservas', correct: true, responseTimeMs: 3000, ...overrides[1] },
      { phraseId: '3', category: 'quejas', correct: false, responseTimeMs: 5000, ...overrides[2] },
      { phraseId: '4', category: 'quejas', correct: false, responseTimeMs: 5000, ...overrides[3] },
    ];

    it('builds a complete certification record', () => {
      const cert = buildCertification({
        studentName: 'María',
        role: 'recepcion',
        questionResults: makeResults(),
      });

      expect(cert.studentName).toBe('María');
      expect(cert.role).toBe('recepcion');
      expect(cert.roleLabel).toBe('Recepción Hotelera');
      expect(cert.total).toBe(4);
      expect(cert.score).toBe(2);
      expect(cert.accuracy).toBeCloseTo(0.5);
      expect(cert.avgResponseTimeMs).toBe(4000);
      expect(cert.categoryScores.length).toBe(2);
      expect(cert.passed).toBe(false); // 50% < 70%
      expect(cert.verificationCode).toMatch(/^HE-/);
      expect(cert.id).toMatch(/^cert-/);
      expect(cert.examDate).toBe(new Date().toISOString().split('T')[0]);
    });

    it('marks as passed when accuracy >= threshold', () => {
      const results: ExamQuestionResult[] = [
        { phraseId: '1', category: 'reservas', correct: true, responseTimeMs: 2000 },
        { phraseId: '2', category: 'reservas', correct: true, responseTimeMs: 2000 },
        { phraseId: '3', category: 'quejas', correct: true, responseTimeMs: 2000 },
        { phraseId: '4', category: 'quejas', correct: true, responseTimeMs: 2000 },
      ];
      const cert = buildCertification({
        studentName: 'Juan',
        role: 'bar',
        questionResults: results,
        passingThreshold: 0.7,
      });
      expect(cert.passed).toBe(true);
      expect(cert.competencyIndex).toBeGreaterThanOrEqual(70);
    });

    it('computes correct competency index', () => {
      const results: ExamQuestionResult[] = [
        { phraseId: '1', category: 'x', correct: true, responseTimeMs: 2000 },
        { phraseId: '2', category: 'x', correct: true, responseTimeMs: 2000 },
        { phraseId: '3', category: 'x', correct: false, responseTimeMs: 2000 },
      ];
      const cert = buildCertification({
        studentName: 'Test',
        role: 'limpieza',
        questionResults: results,
      });
      expect(cert.accuracy).toBeCloseTo(2 / 3);
      expect(cert.competencyIndex).toBeGreaterThan(0);
      expect(cert.competencyIndex).toBeLessThanOrEqual(100);
    });

    it('uses default student name when empty', () => {
      const cert = buildCertification({
        studentName: '',
        role: 'mantenimiento',
        questionResults: [
          { phraseId: '1', category: 'x', correct: true, responseTimeMs: 1000 },
        ],
      });
      expect(cert.studentName).toBe('');
    });
  });

  describe('ROLE_META', () => {
    it('has all five roles defined', () => {
      const roles = Object.keys(ROLE_META);
      expect(roles).toContain('recepcion');
      expect(roles).toContain('restaurante');
      expect(roles).toContain('limpieza');
      expect(roles).toContain('mantenimiento');
      expect(roles).toContain('bar');
    });

    it('each role has a label and title', () => {
      for (const [, meta] of Object.entries(ROLE_META)) {
        expect(meta.label).toBeTruthy();
        expect(meta.title).toBeTruthy();
        expect(meta.title).toContain('Certificación');
      }
    });
  });
});
