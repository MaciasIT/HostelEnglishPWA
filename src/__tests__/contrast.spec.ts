import { describe, it, expect } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { audit } from '../../scripts/contrast-audit.mjs';

type Row = { mode: string; fg: string; bg: string; ratio: number; min: number; pass: boolean };

describe('Contraste WCAG AAA de tokens de diseño', () => {
  const rows = audit() as Row[];
  for (const mode of ['dark', 'light']) {
    it(`todas las combinaciones texto/superficie cumplen ≥7:1 (texto) y ≥3:1 (foco) en modo ${mode}`, () => {
      const fails = rows.filter((r) => r.mode === mode && !r.pass).map((r) => `${r.fg} sobre ${r.bg}: ${r.ratio}:1 < ${r.min}`);
      expect(fails).toEqual([]);
    });
  }
  it('audita un conjunto no trivial de combinaciones', () => {
    expect(rows.length).toBeGreaterThan(100);
  });
});
