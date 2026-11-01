import { describe, it, expect } from 'vitest';

import {
  generateProceduralScenario,
  generateAllProceduralScenarios,
  countProceduralCombinations,
  buildProceduralSystemPrompt,
  generateOpeningDialogue,
  PROCEDURAL_DEPARTMENTS,
  CUSTOMER_PROFILES,
  PLOT_TWISTS,
} from './proceduralRoleplayGenerator';
import type { DialogueEngine } from './proceduralRoleplayGenerator';

import {
  evaluateHospitality,
  politenessLevelFor,
  POLITENESS_LEVEL_LABELS,
} from './politenessEvaluator';

/** Motor fake que devuelve una línea fija (o lanza) sin tocar la red. */
function makeEngine(
  line: string,
  fail = false,
): DialogueEngine {
  return {
    async generate(_messages, _callbacks, _options) {
      if (fail) throw new Error('motor caído');
      return { id: 'test-id', fullText: line, elapsedMs: 1 };
    },
  };
}

/* ------------------------------------------------------------------------- */
/* Generador procedural                                                       */
/* ------------------------------------------------------------------------- */

describe('generateProceduralScenario', () => {
  it('construye un escenario completo con ejes explícitos', () => {
    const scenario = generateProceduralScenario({
      department: 'sala',
      customerProfile: 'anniversary_couple',
      plotTwist: 'cold_plate',
    });

    expect(scenario.id).toBe('sala-anniversary_couple-cold_plate');
    expect(scenario.department).toBe('sala');
    expect(scenario.customerProfile).toBe('anniversary_couple');
    expect(scenario.plotTwist).toBe('cold_plate');
    expect(scenario.persona.length).toBeGreaterThan(10);
    expect(scenario.situation.length).toBeGreaterThan(20);
    expect(scenario.objective.length).toBeGreaterThan(10);
    expect(scenario.openingLine.length).toBeGreaterThan(10);
    expect(scenario.expectedVocabulary.length).toBeGreaterThan(0);
    expect(scenario.level).toBe('B1-B2');
  });

  it('es determinista para una misma semilla', () => {
    const a = generateProceduralScenario({ seed: 42 });
    const b = generateProceduralScenario({ seed: 42 });
    expect(a.id).toBe(b.id);
    expect(a.openingLine).toBe(b.openingLine);
  });

  it('honra los ejes parcialmente fijados y deja el resto al seed', () => {
    const scenario = generateProceduralScenario({ department: 'pisos', seed: 7 });
    expect(scenario.department).toBe('pisos');
    expect(PLOT_TWISTS.map((t) => t.id)).toContain(scenario.plotTwist);
    expect(CUSTOMER_PROFILES.map((p) => p.id)).toContain(scenario.customerProfile);
  });

  it('sin argumentos produce un escenario válido aleatorio', () => {
    const scenario = generateProceduralScenario();
    expect(PROCEDURAL_DEPARTMENTS.map((d) => d.id)).toContain(scenario.department);
    expect(scenario.systemPrompt.length).toBeGreaterThan(0);
    expect(scenario.title.length).toBeGreaterThan(0);
  });
});

describe('buildProceduralSystemPrompt', () => {
  it('incluye restricciones anti-alucinación, persona, situación y nivel', () => {
    const scenario = generateProceduralScenario({
      department: 'barra',
      customerProfile: 'business_rush',
      plotTwist: 'bill_error',
    });

    expect(scenario.systemPrompt).toContain('B1-B2');
    expect(scenario.systemPrompt).toContain('Never reveal that you are an AI');
    expect(scenario.systemPrompt).toContain('ONE request');
    expect(scenario.systemPrompt).toContain('business traveller');
    expect(scenario.systemPrompt).toContain('charge on the bill');
    expect(scenario.systemPrompt).toContain('the bar');
  });

  it('es reutilizable como función pura sobre el borrador', () => {
    const scenario = generateProceduralScenario({ seed: 1 });
    const rebuilt = buildProceduralSystemPrompt(scenario);
    expect(rebuilt).toBe(scenario.systemPrompt);
  });
});

describe('combinatoria', () => {
  it('genera todas las combinaciones sin duplicados', () => {
    const all = generateAllProceduralScenarios();
    expect(all).toHaveLength(countProceduralCombinations());
    expect(countProceduralCombinations()).toBe(5 * 5 * 4);

    const ids = new Set(all.map((s) => s.id));
    expect(ids.size).toBe(all.length);
  });

  it('cada combinación tiene system prompt y apertura no vacíos', () => {
    for (const scenario of generateAllProceduralScenarios()) {
      expect(scenario.systemPrompt.length).toBeGreaterThan(20);
      expect(scenario.openingLine.length).toBeGreaterThan(10);
      expect(scenario.expectedVocabulary.length).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('generateOpeningDialogue', () => {
  it('usa la línea del motor LLM cuando la generación tiene éxito', async () => {
    const scenario = generateProceduralScenario({
      department: 'recepcion',
      customerProfile: 'language_tourist',
      plotTwist: 'noisy_room',
    });
    const result = await generateOpeningDialogue(
      scenario,
      makeEngine('Sorry, could you help me with the noise in my room?'),
    );

    expect(result.source).toBe('llm');
    expect(result.openingLine).toBe('Sorry, could you help me with the noise in my room?');
  });

  it('degrada a la apertura determinista si el motor falla', async () => {
    const scenario = generateProceduralScenario({
      department: 'recepcion',
      plotTwist: 'noisy_room',
      customerProfile: 'family_kids',
    });
    const result = await generateOpeningDialogue(scenario, makeEngine('', true));

    expect(result.source).toBe('deterministic');
    expect(result.openingLine).toBe(scenario.openingLine);
  });

  it('envía el system prompt del escenario como contexto al motor', async () => {
    const scenario = generateProceduralScenario({
      department: 'cocina',
      customerProfile: 'undercover_critic',
      plotTwist: 'sudden_allergy',
    });

    const seen: Array<{ role: string; content: string }> = [];
    const engine: DialogueEngine = {
      async generate(messages, _callbacks, _options) {
        seen.push(...messages.map((m) => ({ role: m.role, content: m.content })));
        return { id: 't', fullText: 'Could you check this for me, please?', elapsedMs: 1 };
      },
    };

    await generateOpeningDialogue(scenario, engine);

    expect(seen[0].role).toBe('system');
    expect(seen[0].content).toContain(scenario.situation);
  });
});

/* ------------------------------------------------------------------------- */
/* Evaluador de adecuación hostelera                                          */
/* ------------------------------------------------------------------------- */

describe('evaluateHospitality — cortesía / modales', () => {
  it('puntúa alto una respuesta cortés y resolutiva', () => {
    const result = evaluateHospitality(
      'Certainly. Let me check that for you right away. I apologize for the inconvenience — may I offer you a safe alternative, please?',
    );

    expect(result.politenessScore).toBeGreaterThanOrEqual(85);
    expect(result.level).toBe('excelente');
    expect(result.suggestedBetterPhrase).toBeUndefined();
  });

  it('detecta el imperativo directo y sugiere una alternativa cortés', () => {
    const result = evaluateHospitality('Give me the menu.');

    expect(result.politenessScore).toBeLessThan(55);
    expect(result.courtesy.score).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual('Could you please…?');
  });

  it('no confunde una petición cortés con un imperativo', () => {
    const result = evaluateHospitality('Could you please give me the menu?');

    expect(result.suggestedBetterPhrase).toBeUndefined();
    expect(result.courtesy.score).toBeGreaterThanOrEqual(70);
  });
});

describe('evaluateHospitality — resolución práctica', () => {
  it('penaliza la evasión con una sugerencia de resolución', () => {
    const result = evaluateHospitality("I don't know.");

    expect(result.politenessScore).toBeLessThan(55);
    expect(result.resolution.score).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual('Let me find out for you right away.');
  });

  it('detecta «not my problem» como evasión clara', () => {
    const result = evaluateHospitality("That's not my problem.");

    expect(result.resolution.score).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual('Let me look into that for you.');
  });
});

describe('evaluateHospitality — tono profesional', () => {
  it('penaliza una respuesta seca como «What?»', () => {
    const result = evaluateHospitality('What?');

    expect(result.tone.score).toBeLessThan(55);
    expect(result.politenessScore).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual('How may I help you?');
  });

  it('penaliza «No have» (inglés incorrecto e informal)', () => {
    const result = evaluateHospitality('No have that here.');

    expect(result.tone.score).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual(
      "I'm afraid we don't have that — may I offer a similar option?",
    );
  });

  it('penaliza «Wait» y propone una alternativa cordial', () => {
    const result = evaluateHospitality('Wait.');

    expect(result.tone.score).toBeLessThan(55);
    expect(result.suggestedBetterPhrase).toEqual(
      'One moment, please — let me check that for you.',
    );
  });
});

describe('evaluateHospitality — casos límite', () => {
  it('devuelve una nota baja para una respuesta vacía', () => {
    const result = evaluateHospitality('   ');
    expect(result.politenessScore).toBeLessThan(30);
    expect(result.level).toBe('descortés');
  });

  it('mantiene la nota global siempre en el rango 0–100', () => {
    const samples = [
      'Give me my money. Hurry up. Shut up.',
      'What?',
      'No have.',
      'Thank you so much, could you please help me?',
      'Certainly, I will do it right away.',
    ];
    for (const sample of samples) {
      const { politenessScore } = evaluateHospitality(sample);
      expect(politenessScore).toBeGreaterThanOrEqual(0);
      expect(politenessScore).toBeLessThanOrEqual(100);
    }
  });
});

describe('politenessLevelFor y etiquetas', () => {
  it('mapea puntuaciones a los niveles correctos', () => {
    expect(politenessLevelFor(100)).toBe('excelente');
    expect(politenessLevelFor(86)).toBe('excelente');
    expect(politenessLevelFor(70)).toBe('buena');
    expect(politenessLevelFor(55)).toBe('buena');
    expect(politenessLevelFor(40)).toBe('mejorable');
    expect(politenessLevelFor(30)).toBe('mejorable');
    expect(politenessLevelFor(10)).toBe('descortés');
  });

  it('expone etiquetas legibles para todos los niveles', () => {
    expect(POLITENESS_LEVEL_LABELS).toEqual({
      excelente: 'Excelente',
      buena: 'Buena',
      mejorable: 'Mejorable',
      descortés: 'Descortés',
    });
  });
});