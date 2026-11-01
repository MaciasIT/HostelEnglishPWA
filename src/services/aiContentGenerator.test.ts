import { describe, it, expect } from 'vitest';
import {
  generateVariants,
  generateDistractors,
  buildMultipleChoice,
  seededShuffle,
  mulberry32,
  SentenceVariantSchema,
  DistractorSchema,
  aiContentGenerator,
} from '@/services/aiContentGenerator';

describe('aiContentGenerator', () => {
  // -------------------------------------------------------------------------
  // Utilidades deterministas
  // -------------------------------------------------------------------------
  describe('mulberry32 / seededShuffle', () => {
    it('mulberry32 es determinista para la misma semilla', () => {
      const r1 = mulberry32(42);
      const r2 = mulberry32(42);
      expect(r1()).toBe(r2());
      expect(r1()).toBe(r2());
    });

    it('seededShuffle no muta el array original', () => {
      const input = ['a', 'b', 'c'];
      const out = seededShuffle(input, 7);
      expect(input).toEqual(['a', 'b', 'c']);
      expect(out.sort()).toEqual(['a', 'b', 'c']);
    });

    it('seededShuffle es determinista para la misma semilla', () => {
      expect(seededShuffle(['a', 'b', 'c', 'd'], 3)).toEqual(
        seededShuffle(['a', 'b', 'c', 'd'], 3),
      );
    });
  });

  // -------------------------------------------------------------------------
  // 1. Variantes sintácticas
  // -------------------------------------------------------------------------
  describe('generateVariants', () => {
    it('devuelve array vacío para entrada vacía', () => {
      expect(generateVariants('')).toEqual([]);
      expect(generateVariants('   ')).toEqual([]);
    });

    it('produce la variante del ejemplo: "Could I have the bill?" -> "May we get the check, please?"', () => {
      const variants = generateVariants('Could I have the bill?', { maxVariants: 24 });
      const target = variants.find((v) => v.text === 'May we get the check, please?');
      expect(target).toBeDefined();
      expect(target!.formality).toBe('neutral');
      expect(target!.kinds).toContain('lexical');
      expect(target!.preservesIntent).toBe(true);
    });

    it('todas las variantes cumplen el esquema Zod y conservan la intención', () => {
      const variants = generateVariants('Could I have the bill?', { maxVariants: 24 });
      expect(variants.length).toBeGreaterThan(0);
      for (const v of variants) {
        expect(() => SentenceVariantSchema.parse(v)).not.toThrow();
        expect(v.preservesIntent).toBe(true);
        expect(v.requiresReview).toBe(true);
        expect(v.text.length).toBeGreaterThan(0);
      }
    });

    it('respeta maxVariants', () => {
      const variants = generateVariants('Could I have the bill?', { maxVariants: 3 });
      expect(variants.length).toBeLessThanOrEqual(3);
    });

    it('sin patrón de petición devuelve al menos la frase original (neutral)', () => {
      const variants = generateVariants('The hotel is near the beach');
      expect(variants.length).toBeGreaterThanOrEqual(1);
      expect(variants[0].text).toBe('The hotel is near the beach');
      expect(variants[0].formality).toBe('neutral');
    });

    it('cubre los tres niveles de formalidad para una petición', () => {
      const variants = generateVariants('Could I have the bill?', { maxVariants: 24 });
      const formalities = new Set(variants.map((v) => v.formality));
      expect(formalities.has('formal')).toBe(true);
      expect(formalities.has('neutral')).toBe(true);
      expect(formalities.has('informal')).toBe(true);
    });

    it('no devuelve variantes duplicadas', () => {
      const variants = generateVariants('Could I have the bill?', { maxVariants: 24 });
      const texts = variants.map((v) => v.text.trim());
      expect(new Set(texts).size).toBe(texts.length);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Distractores gramaticales
  // -------------------------------------------------------------------------
  describe('generateDistractors', () => {
    it('devuelve array vacío para entrada vacía', () => {
      expect(generateDistractors('')).toEqual([]);
    });

    it('detecta error de concordancia (there are -> there is)', () => {
      const dist = generateDistractors('There are many guests in the lobby');
      expect(dist.length).toBeGreaterThan(0);
      const agreement = dist.find((d) => d.errorType === 'agreement');
      expect(agreement).toBeDefined();
      expect(agreement!.text).toBe('There is many guests in the lobby');
    });

    it('detecta error de preposición (interested in -> interested on)', () => {
      const dist = generateDistractors('I am interested in the menu');
      const prep = dist.find((d) => d.errorType === 'preposition');
      expect(prep).toBeDefined();
      expect(prep!.text).toBe('I am interested on the menu');
      expect(prep!.explanation).toContain('interested in');
    });

    it('detecta error de forma verbal (have seen -> have saw)', () => {
      const dist = generateDistractors('I have seen that film');
      const verb = dist.find((d) => d.errorType === 'verb_form');
      expect(verb).toBeDefined();
      expect(verb!.text).toBe('I have saw that film');
    });

    it('detecta error de orden de palabras en pregunta indirecta', () => {
      const dist = generateDistractors('Can you tell me where the toilet is?');
      const order = dist.find((d) => d.errorType === 'word_order');
      expect(order).toBeDefined();
      expect(order!.text).toBe('Can you tell me where is the toilet?');
    });

    it('detecta error de artículo (an -> a ante vocal)', () => {
      const dist = generateDistractors('I would like an orange juice');
      const article = dist.find((d) => d.errorType === 'article');
      expect(article).toBeDefined();
      expect(article!.text).toBe('I would like a orange juice');
    });

    it('cada distractor cumple el esquema Zod y referencia la frase correcta', () => {
      const correct = 'There are many guests in the lobby';
      const dist = generateDistractors(correct);
      expect(dist.length).toBeGreaterThan(0);
      for (const d of dist) {
        expect(() => DistractorSchema.parse(d)).not.toThrow();
        expect(d.correctReference).toBe(correct);
        expect(d.plausible).toBe(true);
        expect(d.requiresReview).toBe(true);
        expect(d.text).not.toBe(correct);
      }
    });

    it('respeta maxDistractors', () => {
      const dist = generateDistractors('There are many guests in the lobby', {
        maxDistractors: 1,
      });
      expect(dist.length).toBeLessThanOrEqual(1);
    });

    it('devuelve [] cuando no aplica ninguna regla de error', () => {
      expect(generateDistractors('Thank you very much')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Composición de opciones múltiples
  // -------------------------------------------------------------------------
  describe('buildMultipleChoice', () => {
    it('incluye la respuesta correcta entre las opciones', () => {
      const result = buildMultipleChoice('I am interested in the menu', { seed: 1 });
      expect(result.correct).toBe('I am interested in the menu');
      expect(result.options).toContain(result.correct);
    });

    it('todas las opciones son únicas y no vacías', () => {
      const result = buildMultipleChoice('I am interested in the menu', { seed: 2 });
      expect(new Set(result.options).size).toBe(result.options.length);
      for (const opt of result.options) {
        expect(opt.length).toBeGreaterThan(0);
      }
    });

    it('es determinista para la misma semilla', () => {
      const a = buildMultipleChoice('I am interested in the menu', { seed: 9 });
      const b = buildMultipleChoice('I am interested in the menu', { seed: 9 });
      expect(a.options).toEqual(b.options);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Proveedor por defecto
  // -------------------------------------------------------------------------
  describe('aiContentGenerator (proveedor)', () => {
    it('expone generateVariants y generateDistractors funcionales', () => {
      expect(aiContentGenerator.generateVariants('Could I have the bill?').length).toBeGreaterThan(0);
      expect(
        aiContentGenerator.generateDistractors('There are many guests in the lobby').length,
      ).toBeGreaterThan(0);
    });
  });
});