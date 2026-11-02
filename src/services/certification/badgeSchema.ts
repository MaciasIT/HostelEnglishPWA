/**
 * Generador de credencial verificable OpenBadges 3.0 (W3C VC Data Model 2.0 /
 * 1EdTech OB 3.0) con prueba HMAC SHA-256 offline.
 *
 * Nota de seguridad: la clave HMAC es de la app (offline, sin servidor), por
 * lo que la prueba garantiza integridad frente a alteraciones accidentales o
 * ediciones casuales, NO autenticidad frente a quien extraiga la clave del
 * bundle. Para verificación de terceros haría falta Ed25519 con clave privada
 * en servidor.
 */

export type OralLevel = 'A2' | 'B1' | 'B2';

export const ISSUER_NAME = 'HostelEnglish Professional Certification';
export const ISSUER_ID = 'https://michel-macias.github.io/HostelEnglishPWA/issuer';
export const HMAC_VERIFICATION_KEY = 'hostelenglish-offline-verification-key-v1';
export const PROOF_TYPE = 'HmacSha256Signature2026';

export const LEVEL_CRITERIA: Record<OralLevel, string> = {
  A2: 'Competencia oral demostrada en hostelería a nivel A2: interacciones básicas con clientes.',
  B1: 'Competencia oral demostrada en hostelería a nivel B1: atención autónoma y gestión de incidencias habituales.',
  B2: 'Competencia oral demostrada en hostelería a nivel B2: comunicación fluida y resolución de situaciones complejas.',
};

export interface BadgeInput {
  id: string;
  level: OralLevel;
  recipientName: string;
  issuedAt?: Date;
  score?: number;
}

export interface BadgeProof {
  type: typeof PROOF_TYPE;
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod';
  proofValue: string;
}

export interface OpenBadgeCredential {
  '@context': string[];
  id: string;
  type: ['VerifiableCredential', 'OpenBadgeCredential'];
  issuer: { id: string; type: ['Profile']; name: string };
  validFrom: string;
  name: string;
  credentialSubject: {
    type: ['AchievementSubject'];
    name: string;
    achievement: {
      id: string;
      type: ['Achievement'];
      name: string;
      description: string;
      criteria: { narrative: string };
    };
    result?: { type: ['Result']; value: string }[];
  };
  proof?: BadgeProof;
}

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

/** Serialización canónica (claves ordenadas) para firmar de forma determinista. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(',')}}`;
}

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(HMAC_VERIFICATION_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function unsigned(input: BadgeInput): OpenBadgeCredential {
  if (!(input.level in LEVEL_CRITERIA)) throw new Error(`Nivel no válido: ${input.level}`);
  const issued = (input.issuedAt ?? new Date()).toISOString();
  const cred: OpenBadgeCredential = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: `urn:uuid:${input.id}`,
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: ISSUER_ID, type: ['Profile'], name: ISSUER_NAME },
    validFrom: issued,
    name: `HostelEnglish Oral Proficiency ${input.level}`,
    credentialSubject: {
      type: ['AchievementSubject'],
      name: input.recipientName,
      achievement: {
        id: `${ISSUER_ID}/achievements/oral-${input.level.toLowerCase()}`,
        type: ['Achievement'],
        name: `Competencia oral en hostelería ${input.level}`,
        description: LEVEL_CRITERIA[input.level],
        criteria: { narrative: LEVEL_CRITERIA[input.level] },
      },
    },
  };
  if (typeof input.score === 'number') {
    cred.credentialSubject.result = [{ type: ['Result'], value: `${input.score}%` }];
  }
  return cred;
}

/** Genera la credencial firmada (HMAC SHA-256 sobre JSON canónico sin `proof`). */
export async function generateOpenBadge(input: BadgeInput): Promise<OpenBadgeCredential> {
  const cred = unsigned(input);
  const proofValue = await hmacHex(canonicalize(cred));
  cred.proof = {
    type: PROOF_TYPE,
    created: cred.validFrom,
    verificationMethod: `${ISSUER_ID}#hmac-offline-1`,
    proofPurpose: 'assertionMethod',
    proofValue,
  };
  return cred;
}

/** Verifica offline que la credencial no ha sido alterada. */
export async function verifyOpenBadge(cred: OpenBadgeCredential): Promise<boolean> {
  if (!cred?.proof || cred.proof.type !== PROOF_TYPE) return false;
  const { proof, ...rest } = cred;
  const expected = await hmacHex(canonicalize(rest));
  if (expected.length !== proof.proofValue.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ proof.proofValue.charCodeAt(i);
  return diff === 0;
}

export function badgeToJson(cred: OpenBadgeCredential): string {
  return JSON.stringify(cred, null, 2);
}
