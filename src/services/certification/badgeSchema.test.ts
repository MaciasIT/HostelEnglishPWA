import { describe, it, expect } from 'vitest';
import { generateOpenBadge, verifyOpenBadge, ISSUER_NAME, canonicalize } from './badgeSchema';

const input = { id: 'abc-123', level: 'B1' as const, recipientName: 'Ana', issuedAt: new Date('2026-01-01T00:00:00Z'), score: 85 };

describe('badgeSchema OpenBadges 3.0', () => {
  it('genera JSON-LD conforme con emisor y criterios', async () => {
    const c = await generateOpenBadge(input);
    expect(c['@context'][0]).toContain('credentials/v2');
    expect(c.type).toContain('OpenBadgeCredential');
    expect(c.issuer.name).toBe(ISSUER_NAME);
    expect(c.credentialSubject.achievement.criteria.narrative).toMatch(/Competencia oral demostrada en hostelería/);
    expect(c.proof?.proofValue).toMatch(/^[0-9a-f]{64}$/);
  });
  it('es determinista y verificable offline', async () => {
    const a = await generateOpenBadge(input);
    expect((await generateOpenBadge(input)).proof?.proofValue).toBe(a.proof?.proofValue);
    expect(await verifyOpenBadge(a)).toBe(true);
  });
  it('detecta manipulación', async () => {
    const a = await generateOpenBadge(input);
    a.credentialSubject.name = 'Otro';
    expect(await verifyOpenBadge(a)).toBe(false);
  });
  it('rechaza nivel inválido y credencial sin proof', async () => {
    await expect(generateOpenBadge({ ...input, level: 'C1' as never })).rejects.toThrow();
    const a = await generateOpenBadge(input); delete a.proof;
    expect(await verifyOpenBadge(a)).toBe(false);
  });
  it('canonicalize ordena claves', () => {
    expect(canonicalize({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });
});
