import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PhraseSchema,
  ConversationSchema,
  VariantsFileSchema,
} from '../models/schemas';

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