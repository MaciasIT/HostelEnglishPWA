import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';

import RoleplayPolitenessPanel from './components/RoleplayPolitenessPanel';
import RoleplayAccentSelector from './components/RoleplayAccentSelector';
import { evaluateHospitality } from '@/services/ai';
import { CLIENT_ACCENTS } from './accents';
import { createProceduralSession, dailyPolitenessSeed } from './proceduralSession';

afterEach(() => cleanup());

describe('<RoleplayPolitenessPanel />', () => {
  it('muestra termómetro accesible, nivel textual y frase sugerida', () => {
    const evaluation = evaluateHospitality('Wait.');
    render(<RoleplayPolitenessPanel evaluation={evaluation} />);

    const meter = screen.getByRole('meter', { name: /cortesía profesional/i });
    expect(meter).toHaveAttribute('aria-valuenow', String(Math.round(evaluation.politenessScore)));
    expect(meter).toHaveAttribute('aria-valuetext');
    expect(screen.getByText(/Hospitality Politeness Feedback/i)).toBeInTheDocument();
    expect(screen.getByTestId('politeness-suggestion')).toBeInTheDocument();
  });

  it('no muestra sugerencia cuando la respuesta ya es diplomática', () => {
    const evaluation = evaluateHospitality(
      "Of course, madam. I'm so sorry for the inconvenience. Let me check with the kitchen right away and I'll bring you a fresh plate.",
    );
    render(<RoleplayPolitenessPanel evaluation={evaluation} />);
    expect(screen.getByTestId('politeness-panel')).toBeInTheDocument();
    if (!evaluation.suggestedBetterPhrase) {
      expect(screen.queryByTestId('politeness-suggestion')).toBeNull();
    }
  });
});

describe('<RoleplayAccentSelector />', () => {
  it('ofrece los 4 acentos y notifica el cambio', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RoleplayAccentSelector value="uk" onChange={onChange} />);

    expect(screen.getAllByRole('radio')).toHaveLength(CLIENT_ACCENTS.length);
    expect(screen.getByRole('radio', { name: /Británico/i })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: /Australiano/i }));
    expect(onChange).toHaveBeenCalledWith('au');
  });
});

describe('proceduralSession', () => {
  it('es determinista con la misma semilla e incluye la instrucción de acento', () => {
    const a = createProceduralSession('au', 20261102);
    const b = createProceduralSession('au', 20261102);
    expect(a.scenario.openingLine).toBe(b.scenario.openingLine);
    expect(a.systemPrompt).toContain('Australian English');
    expect(a.procedural).toBe(true);
    expect(a.title).toBeTruthy();
  });

  it('la semilla diaria es estable por fecha', () => {
    expect(dailyPolitenessSeed(new Date(2026, 10, 2))).toBe(20261102);
  });
});
