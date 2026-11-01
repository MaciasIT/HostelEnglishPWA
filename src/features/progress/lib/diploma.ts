import qrcode from 'qrcode-generator';

export interface DiplomaData {
  studentName: string;
  department: string;
  /** Nota 0–100. */
  grade: number;
  /** Fecha ISO yyyy-mm-dd. */
  date: string;
  certId: string;
}

export interface SignedDiploma {
  data: DiplomaData;
  /** Código compacto verificable: HE1.<payload>.<firma>.<clavePública>. */
  code: string;
}

const PREFIX = 'HE1';
const KEY_STORAGE = 'hostel-diploma-key-v1';

const toB64Url = (bytes: Uint8Array): string => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64Url = (str: string): Uint8Array<ArrayBuffer> => {
  const b = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

const payloadBytes = (d: DiplomaData) =>
  new TextEncoder().encode(
    JSON.stringify({ n: d.studentName, r: d.department, g: Math.round(d.grade), d: d.date, i: d.certId })
  );

/** Par de claves Ed25519 del dispositivo, persistido como JWK en localStorage. */
export async function getDeviceKeyPair(): Promise<{ privateKey: CryptoKey; publicRaw: Uint8Array }> {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY_STORAGE) : null;
  if (stored) {
    const { priv, pub } = JSON.parse(stored) as { priv: JsonWebKey; pub: string };
    const privateKey = await crypto.subtle.importKey('jwk', priv, { name: 'Ed25519' }, false, ['sign']);
    return { privateKey, publicRaw: fromB64Url(pub) };
  }
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  try {
    localStorage.setItem(KEY_STORAGE, JSON.stringify({ priv, pub: toB64Url(publicRaw) }));
  } catch {
    /* almacenamiento no disponible: clave efímera */
  }
  return { privateKey: pair.privateKey, publicRaw };
}

export async function signDiploma(
  data: DiplomaData,
  keys?: { privateKey: CryptoKey; publicRaw: Uint8Array }
): Promise<SignedDiploma> {
  const { privateKey, publicRaw } = keys ?? (await getDeviceKeyPair());
  const bytes = payloadBytes(data);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, privateKey, bytes));
  return { data, code: [PREFIX, toB64Url(bytes), toB64Url(sig), toB64Url(publicRaw)].join('.') };
}

export type VerifyResult =
  | { ok: true; data: DiplomaData; publicKey: string }
  | { ok: false; error: string };

/** Verificación offline: la firma debe coincidir con la clave pública incluida. */
export async function verifyDiplomaCode(code: string): Promise<VerifyResult> {
  try {
    const [prefix, p, s, k] = code.trim().split('.');
    if (prefix !== PREFIX || !p || !s || !k) return { ok: false, error: 'Formato inválido' };
    const bytes = fromB64Url(p);
    const key = await crypto.subtle.importKey('raw', fromB64Url(k), { name: 'Ed25519' }, false, ['verify']);
    const valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, fromB64Url(s), bytes);
    if (!valid) return { ok: false, error: 'Firma inválida' };
    const o = JSON.parse(new TextDecoder().decode(bytes)) as { n: string; r: string; g: number; d: string; i: string };
    return {
      ok: true,
      publicKey: k,
      data: { studentName: o.n, department: o.r, grade: o.g, date: o.d, certId: o.i },
    };
  } catch {
    return { ok: false, error: 'Código no verificable' };
  }
}

/** Código corto legible para mostrar junto al QR (primeros 12 hex de la firma). */
export function shortCode(code: string): string {
  const sig = code.split('.')[2] ?? '';
  const hex = Array.from(fromB64Url(sig).slice(0, 6))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `HE-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/** Matriz QR (true = módulo oscuro). */
export function qrMatrix(text: string): boolean[][] {
  const qr = qrcode(0, 'L');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const DIPLOMA_WIDTH = 1600;
export const DIPLOMA_HEIGHT = 1131;

/** SVG autocontenido (sin recursos externos) del diploma con QR. */
export function buildDiplomaSvg(diploma: SignedDiploma): string {
  const { data, code } = diploma;
  const m = qrMatrix(code);
  const cell = 5;
  const qrSize = m.length * cell;
  const qx = DIPLOMA_WIDTH - qrSize - 120;
  const qy = DIPLOMA_HEIGHT - qrSize - 120;
  let rects = '';
  m.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) rects += `<rect x="${qx + c * cell}" y="${qy + r * cell}" width="${cell}" height="${cell}"/>`;
    })
  );
  const font = 'font-family="Georgia, serif"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${DIPLOMA_WIDTH}" height="${DIPLOMA_HEIGHT}" viewBox="0 0 ${DIPLOMA_WIDTH} ${DIPLOMA_HEIGHT}" role="img" aria-label="Diploma de ${esc(data.studentName)}">
<rect width="100%" height="100%" fill="#fffdf6"/>
<rect x="40" y="40" width="${DIPLOMA_WIDTH - 80}" height="${DIPLOMA_HEIGHT - 80}" fill="none" stroke="#b8860b" stroke-width="8"/>
<rect x="64" y="64" width="${DIPLOMA_WIDTH - 128}" height="${DIPLOMA_HEIGHT - 128}" fill="none" stroke="#b8860b" stroke-width="2"/>
<text x="800" y="220" text-anchor="middle" ${font} font-size="64" fill="#1f2937" letter-spacing="6">DIPLOMA DE CERTIFICACIÓN</text>
<text x="800" y="290" text-anchor="middle" ${font} font-size="32" fill="#6b7280">Hostel English · Inglés profesional para hostelería</text>
<text x="800" y="420" text-anchor="middle" ${font} font-size="30" fill="#374151">Se certifica que</text>
<text x="800" y="520" text-anchor="middle" ${font} font-size="88" font-style="italic" fill="#111827">${esc(data.studentName)}</text>
<line x1="400" y1="545" x2="1200" y2="545" stroke="#b8860b" stroke-width="2"/>
<text x="800" y="620" text-anchor="middle" ${font} font-size="30" fill="#374151">ha completado la certificación del departamento</text>
<text x="800" y="690" text-anchor="middle" ${font} font-size="48" font-weight="bold" fill="#1f2937">${esc(data.department)}</text>
<text x="800" y="770" text-anchor="middle" ${font} font-size="36" fill="#374151">con una nota de ${Math.round(data.grade)}/100</text>
<text x="120" y="${DIPLOMA_HEIGHT - 150}" ${font} font-size="26" fill="#374151">Fecha: ${esc(data.date)}</text>
<text x="120" y="${DIPLOMA_HEIGHT - 110}" ${font} font-size="26" fill="#374151">Código: ${esc(shortCode(code))}</text>
<text x="${qx + qrSize / 2}" y="${qy - 16}" text-anchor="middle" ${font} font-size="20" fill="#6b7280">Verificación Ed25519 offline</text>
<rect x="${qx - 12}" y="${qy - 12}" width="${qrSize + 24}" height="${qrSize + 24}" fill="#fff"/>
<g fill="#000">${rects}</g>
</svg>`;
}

/** Rasteriza el SVG a PNG (alta resolución, `scale`× el tamaño base). */
export async function diplomaToPngBlob(svg: string, scale = 2): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('No se pudo renderizar el diploma'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = DIPLOMA_WIDTH * scale;
    canvas.height = DIPLOMA_HEIGHT * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error('Exportación PNG fallida'))), 'image/png')
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** PDF (para impresión) vía ventana de impresión del navegador, sin dependencias. */
export function printDiplomaAsPdf(svg: string): void {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(
    `<!doctype html><title>Diploma</title><style>@page{size:A4 landscape;margin:0}body{margin:0}svg{width:100vw;height:auto}</style>${svg}`
  );
  w.document.close();
  w.focus();
  w.print();
}
