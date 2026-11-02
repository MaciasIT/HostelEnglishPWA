import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  IpaSchema,
  PhraseSchema,
  ConversationSchema,
  VariantsFileSchema,
} from '../models/schemas';
import { phonemize } from '../services/audio/phonemizer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../public/data');
const phrasesPath = path.join(dataDir, 'hostelenglish_dataset_clean.json');
const conversationsPath = path.join(dataDir, 'conversations_extended_v4.json');
const variantsPath = path.join(dataDir, 'variants.json');

describe('Data Integrity - Euskera Translations', () => {
  it('all phrases should have a Basque translation', () => {
    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const missing = data.phrases.filter((p: any) => !p.eu || p.eu.trim() === '');

    if (missing.length > 0) {
      console.log(`Missing Euskera in phrases: ${missing.length}`);
      // Only show first 5 to keep log clean
      console.log('Sample missing:', missing.slice(0, 5).map((p: any) => p.es));
    }

    expect(missing.length).toBe(0);
  });

  it('all conversation messages should have a Basque translation', () => {
    const data = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
    let missingCount = 0;
    const missingSamples: string[] = [];

    data.conversations.forEach((conv: any) => {
      conv.dialogue.forEach((message: any) => {
        if (!message.eu || message.eu.trim() === '') {
          missingCount++;
          if (missingSamples.length < 5) missingSamples.push(message.es);
        }
      });
      if (!conv.title_eu) {
        missingCount++;
        if (missingSamples.length < 5) missingSamples.push(`Title: ${conv.title}`);
      }
      if (!conv.scenario_eu) {
        missingCount++;
        if (missingSamples.length < 5) missingSamples.push(`Scenario: ${conv.scenario}`);
      }
    });

    if (missingCount > 0) {
      console.log(`Missing Euskera in conversations: ${missingCount}`);
      console.log('Sample missing:', missingSamples);
    }

    expect(missingCount).toBe(0);
  });
});

describe('Data Integrity - FD-02 (esquemas Zod + IPA + variantes)', () => {
  it('all phrases validate against PhraseSchema', () => {
    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const failures: string[] = [];
    data.phrases.forEach((p: any) => {
      const r = PhraseSchema.safeParse(p);
      if (!r.success) {
        failures.push(`id=${p.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('every phrase carries a non-empty ipa field', () => {
    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const missing = data.phrases.filter((p: any) => !p.ipa || String(p.ipa).trim() === '');
    expect(missing.map((p: any) => p.id)).toEqual([]);
  });

  it('phrase ids are unique', () => {
    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const ids = data.phrases.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all conversations validate against ConversationSchema', () => {
    const data = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
    const failures: string[] = [];
    data.conversations.forEach((c: any) => {
      const r = ConversationSchema.safeParse(c);
      if (!r.success) {
        failures.push(`id=${c.id}: ${r.error.issues.map((i) => i.message).join('; ')}`);
      }
    });
    expect(failures).toEqual([]);
  });

  it('variants.json validates and covers the six required mappings', () => {
    const raw = JSON.parse(fs.readFileSync(variantsPath, 'utf8'));
    const parsed = VariantsFileSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const ids = parsed.data.variants.map((v) => v.id);
    const required = [
      'bill-check',
      'aubergine-eggplant',
      'coriander-cilantro',
      'chips-fries-crisps',
      'dessert-pudding-sweet',
      'starter-appetizer',
    ];
    for (const r of required) {
      expect(ids, `falta la variante ${r}`).toContain(r);
    }
    // ids únicos
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('adds at least 120 new phrases covering all five departments', () => {
    const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
    const added = data.phrases.filter((p: any) => p.source === 'FD-02');
    expect(added.length).toBeGreaterThanOrEqual(120);

    const covered = new Set(added.map((p: any) => p.categoria));
    const departments = ['Recepción', 'Bar', 'Restaurante', 'Cocina', 'Limpieza', 'Mantenimiento'];
    for (const d of departments) {
      expect(covered, `falta cobertura del departamento ${d}`).toContain(d);
    }
  });

  it('new conversations cover the five departments', () => {
    const data = JSON.parse(fs.readFileSync(conversationsPath, 'utf8'));
    const added = data.conversations.filter((c: any) => String(c.id).startsWith('fd02_'));
    expect(added.length).toBeGreaterThanOrEqual(10);

    const covered = new Set(added.map((c: any) => c.categoria));
    const departments = ['Recepción', 'Bar', 'Restaurante', 'Cocina', 'Limpieza', 'Mantenimiento'];
    for (const d of departments) {
      expect(covered, `falta conversación del departamento ${d}`).toContain(d);
    }
  });
});

describe('Data Integrity - PM-03 (sumillería, coctelería y alérgenos)', () => {
  const data = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
  const pm03: any[] = data.phrases.filter((p: any) => p.source === 'PM-03');
  const categories = ['Sumillería', 'Coctelería', 'Alérgenos'];

  it('contains exactly 120 PM-03 phrases, 40 per category', () => {
    expect(pm03).toHaveLength(120);
    for (const c of categories) {
      expect(pm03.filter((p) => p.category === c), c).toHaveLength(40);
    }
  });

  it('ids are pm03_001..pm03_120 and globally unique', () => {
    const expected = Array.from({ length: 120 }, (_, i) => `pm03_${String(i + 1).padStart(3, '0')}`);
    expect(pm03.map((p) => p.id).sort()).toEqual(expected);
    const ids = data.phrases.map((p: any) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every PM-03 phrase has category, difficulty 1-3, es/en/eu, ipa and legacy categoria', () => {
    const problems: string[] = [];
    for (const p of pm03) {
      if (!categories.includes(p.category)) problems.push(`${p.id}: category`);
      if (!Number.isInteger(p.difficulty) || p.difficulty < 1 || p.difficulty > 3) {
        problems.push(`${p.id}: difficulty`);
      }
      for (const k of ['es', 'en', 'eu', 'ipa']) {
        if (typeof p[k] !== 'string' || p[k].trim() === '') problems.push(`${p.id}: ${k}`);
      }
      const expectedDept = p.category === 'Coctelería' ? 'Bar' : 'Restaurante';
      if (p.categoria !== expectedDept) problems.push(`${p.id}: categoria ${p.categoria}`);
      if (/[/[\]]/.test(p.ipa ?? '')) problems.push(`${p.id}: ipa con barras/corchetes`);
    }
    expect(problems).toEqual([]);
  });

  it('PhraseSchema and IpaSchema accept every PM-03 object and keep category/difficulty', () => {
    for (const p of pm03) {
      expect(IpaSchema.safeParse(p.ipa).success, `${p.id} ipa`).toBe(true);
      const r = PhraseSchema.safeParse(p);
      expect(r.success, p.id).toBe(true);
      if (r.success) {
        expect(r.data.category).toBe(p.category);
        expect(r.data.difficulty).toBe(p.difficulty);
      }
    }
  });

  it('PhraseSchema rejects invalid category/difficulty but accepts legacy rows', () => {
    const base = { id: 'x', es: 'a', en: 'b' };
    expect(PhraseSchema.safeParse(base).success).toBe(true);
    expect(PhraseSchema.safeParse({ ...base, category: 'Otra' }).success).toBe(false);
    for (const d of [0, 4, 1.5]) {
      expect(PhraseSchema.safeParse({ ...base, difficulty: d }).success, String(d)).toBe(false);
    }
  });

  it('existing English and Basque G2P process every PM-03 phrase with non-empty output', () => {
    const empty: string[] = [];
    for (const p of pm03) {
      if (phonemize(p.en, 'en').length === 0) empty.push(`${p.id}: en`);
      if (phonemize(p.eu, 'eu').length === 0) empty.push(`${p.id}: eu`);
    }
    expect(empty).toEqual([]);
  });

  it('preserves the previous phrases (772 legacy rows)', () => {
    expect(data.phrases.length - pm03.length).toBeGreaterThanOrEqual(772);
  });
});