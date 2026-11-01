import { describe, it, expect } from 'vitest';
import {
  ROLEPLAY_SCENARIOS,
  buildRoleplaySystemPrompt,
  buildRoleplayMessages,
} from './roleplayPromptBuilder';

describe('ROLEPLAY_SCENARIOS', () => {
  it('define los escenarios canónicos de hostelería', () => {
    expect(Object.keys(ROLEPLAY_SCENARIOS).sort()).toEqual(
      ['bar', 'checkin', 'checkout', 'complaint', 'restaurant', 'room_service'],
    );
  });

  it('cada escenario tiene persona y situación', () => {
    for (const scenario of Object.values(ROLEPLAY_SCENARIOS)) {
      expect(scenario.persona.length).toBeGreaterThan(10);
      expect(scenario.situation.length).toBeGreaterThan(20);
    }
  });
});

describe('buildRoleplaySystemPrompt', () => {
  it('incluye restricciones anti-alucinación y de vocabulario', () => {
    const prompt = buildRoleplaySystemPrompt(ROLEPLAY_SCENARIOS.checkin);
    expect(prompt).toContain('B1-B2');
    expect(prompt).toContain('Never reveal that you are an AI');
    expect(prompt).toContain('ONE request');
    expect(prompt).toContain(ROLEPLAY_SCENARIOS.checkin.situation);
  });

  it('admite idioma destino distinto del inglés', () => {
    const prompt = buildRoleplaySystemPrompt(ROLEPLAY_SCENARIOS.checkin, { language: 'es' });
    expect(prompt).toContain('Habla en español');
  });

  it('puede desactivar las pistas', () => {
    const prompt = buildRoleplaySystemPrompt(ROLEPLAY_SCENARIOS.complaint, { allowHints: false });
    expect(prompt).toContain('Do not offer hints');
  });
});

describe('buildRoleplayMessages', () => {
  it('empieza con un mensaje system y añade la línea de apertura como assistant', () => {
    const messages = buildRoleplayMessages('checkin', {}, 'Good evening, I have a reservation.');
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].content).toBe('Good evening, I have a reservation.');
  });

  it('sin línea de apertura solo devuelve el system', () => {
    const messages = buildRoleplayMessages('bar');
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
  });
});