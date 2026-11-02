import qrcode from 'qrcode-generator';
import { z } from 'zod';
import { AppStateSchema } from '@/models/schemas';
import { DataValidator } from '@/db/DataValidator';
import { useAppStore } from '@/store/useAppStore';

/**
 * PM-05 · Respaldo y transferencia P2P zero-knowledge.
 * Estado → JSON (con huella SHA-256) → gzip (CompressionStream) → Base64URL.
 * Todo ocurre en el dispositivo: no hay servidor ni cuenta.
 */

export const BACKUP_MAGIC = 'HEB';
export const BACKUP_VERSION = 1;
export const BACKUP_EXTENSION = '.he-backup';
/** Capacidad práctica de un único QR nivel M (versión 40 = 2331 bytes). */
export const SINGLE_QR_MAX_CHARS = 2300;
/** Tamaño de cada fragmento en modo QR dinámico (QR más pequeños = escaneo más fiable). */
export const QR_CHUNK_SIZE = 900;
/** Por encima de este nº de fragmentos se recomienda el fichero. */
export const MAX_QR_CHUNKS = 40;
/** Límite de seguridad al descomprimir (anti zip-bomb). */
const MAX_DECOMPRESSED_BYTES = 20 * 1024 * 1024;

const LicenseInfoSchema = z
  .object({
    email: z.string(),
    tier: z.string(),
    type: z.string(),
    issuedAt: z.number(),
    expiresAt: z.number(),
  })
  .nullable();

export const BackupStateSchema = AppStateSchema.extend({
  isPremium: z.boolean().default(false),
  licenseInfo: LicenseInfoSchema.default(null),
});

export type BackupState = z.infer<typeof BackupStateSchema>;

const EnvelopeSchema = z.object({
  magic: z.literal(BACKUP_MAGIC),
  v: z.literal(BACKUP_VERSION),
  createdAt: z.number(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  state: z.unknown(),
});

export class BackupError extends Error {
  constructor(
    public code: 'FORMAT' | 'INTEGRITY' | 'SCHEMA' | 'COMPRESSION' | 'TOO_LARGE' | 'INCOMPLETE',
    message: string
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

/* ── Utilidades binarias ─────────────────────────────────────────────── */

export const toBase64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const fromBase64Url = (text: string): Uint8Array => {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new BackupError('FORMAT', 'Base64 inválido.');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const streamBytes = async (
  input: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  limit = Infinity
): Promise<Uint8Array> => {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    },
  });
  const reader = source.pipeThrough(transform as unknown as ReadableWritablePair<Uint8Array, Uint8Array>).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new BackupError('TOO_LARGE', 'El respaldo descomprimido excede el límite permitido.');
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
};

export const gzipCompress = (bytes: Uint8Array): Promise<Uint8Array> => {
  if (typeof CompressionStream === 'undefined') {
    throw new BackupError('COMPRESSION', 'Este navegador no soporta CompressionStream.');
  }
  return streamBytes(bytes, new CompressionStream('gzip'));
};

export const gzipDecompress = async (bytes: Uint8Array): Promise<Uint8Array> => {
  if (typeof DecompressionStream === 'undefined') {
    throw new BackupError('COMPRESSION', 'Este navegador no soporta DecompressionStream.');
  }
  try {
    return await streamBytes(bytes, new DecompressionStream('gzip'), MAX_DECOMPRESSED_BYTES);
  } catch (e) {
    if (e instanceof BackupError) throw e;
    throw new BackupError('FORMAT', 'Datos comprimidos corruptos.');
  }
};

export const sha256Hex = async (text: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
};

/* ── Empaquetado ─────────────────────────────────────────────────────── */

/** Extrae del store solo la parte transferible (prefs, progress, reviewItems, license…). */
export const collectState = (): BackupState => {
  const s = useAppStore.getState();
  return BackupStateSchema.parse({
    version: 1,
    progress: s.progress,
    reviewItems: s.reviewItems,
    prefs: s.prefs,
    dailyActivity: s.dailyActivity,
    examHistory: s.examHistory,
    achievements: s.achievements,
    certifications: s.certifications,
    isPremium: s.isPremium,
    licenseInfo: s.licenseInfo,
  });
};

/** Estado → cadena Base64URL de un gzip del sobre firmado. */
export const createBackupPayload = async (
  state: BackupState = collectState(),
  now: number = Date.now()
): Promise<string> => {
  const envelope = {
    magic: BACKUP_MAGIC,
    v: BACKUP_VERSION,
    createdAt: now,
    sha256: await sha256Hex(JSON.stringify(state)),
    state,
  };
  const compressed = await gzipCompress(new TextEncoder().encode(JSON.stringify(envelope)));
  return toBase64Url(compressed);
};

/** Cadena Base64URL → estado validado (firma SHA-256 + Zod). No toca el store. */
export const parseBackupPayload = async (payload: string): Promise<{ state: BackupState; createdAt: number }> => {
  const clean = payload.trim();
  if (!clean) throw new BackupError('FORMAT', 'Respaldo vacío.');
  const json = new TextDecoder().decode(await gzipDecompress(fromBase64Url(clean)));

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new BackupError('FORMAT', 'El respaldo no es JSON válido.');
  }
  const env = EnvelopeSchema.safeParse(raw);
  if (!env.success) throw new BackupError('FORMAT', 'No es un respaldo de HostelEnglish compatible.');

  const hash = await sha256Hex(JSON.stringify(env.data.state));
  if (hash !== env.data.sha256) throw new BackupError('INTEGRITY', 'La firma no coincide: el respaldo está alterado o incompleto.');

  const parsed = BackupStateSchema.safeParse(env.data.state);
  if (!parsed.success) throw new BackupError('SCHEMA', 'Los datos del respaldo no cumplen el esquema esperado.');
  // Pasada por DataValidator para garantizar la misma normalización que la carga de IndexedDB.
  const repaired = DataValidator.validateAndRepair(parsed.data);
  return { state: { ...parsed.data, ...repaired }, createdAt: env.data.createdAt };
};

/** Resumen legible para la confirmación previa a restaurar. */
export const summarizeState = (state: BackupState) => ({
  phrasesStudied: Object.keys(state.progress).length,
  reviewItems: Object.keys(state.reviewItems).length,
  certifications: state.certifications.length,
  achievements: state.achievements.length,
  premium: state.isPremium,
  studentName: state.prefs.studentName ?? '',
});

/** Restaura de forma atómica (un único `setState`) y solo si todo fue validado antes. */
export const restoreState = (state: BackupState): void => {
  const valid = BackupStateSchema.parse(state);
  useAppStore.setState({
    version: valid.version,
    progress: valid.progress,
    reviewItems: valid.reviewItems,
    prefs: valid.prefs,
    dailyActivity: valid.dailyActivity,
    examHistory: valid.examHistory,
    achievements: valid.achievements,
    certifications: valid.certifications,
    isPremium: valid.isPremium,
    licenseInfo: valid.licenseInfo as never,
  } as never);
};

export const importBackupPayload = async (payload: string): Promise<BackupState> => {
  const { state } = await parseBackupPayload(payload);
  restoreState(state);
  return state;
};

/* ── Fichero .he-backup ──────────────────────────────────────────────── */

export const backupFileName = (date: Date = new Date()): string =>
  `hostelenglish-${date.toISOString().slice(0, 10)}${BACKUP_EXTENSION}`;

export const payloadToBlob = (payload: string): Blob => new Blob([payload], { type: 'application/octet-stream' });

export const readBackupFile = async (file: Blob & { name?: string }): Promise<string> => {
  if (file.name && !file.name.toLowerCase().endsWith(BACKUP_EXTENSION)) {
    throw new BackupError('FORMAT', `El archivo debe tener extensión ${BACKUP_EXTENSION}.`);
  }
  if (file.size > 10 * 1024 * 1024) throw new BackupError('TOO_LARGE', 'Archivo demasiado grande.');
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(new BackupError('FORMAT', 'No se pudo leer el archivo.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
};

/* ── Fragmentos QR ───────────────────────────────────────────────────── */

export interface QrFrame {
  index: number; // 1-based
  total: number;
  text: string;
}

const FRAME_RE = /^HEB1:(\d{1,3})\/(\d{1,3}):([0-9a-f]{8}):([A-Za-z0-9_-]*)$/;

const shortId = (payload: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
};

/** Un único QR si cabe; si no, fragmentos secuenciales. `null` ⇒ usar fichero. */
export const planQrFrames = (payload: string): { mode: 'single' | 'multi' | 'file'; frames: QrFrame[] } => {
  const id = shortId(payload);
  if (payload.length <= SINGLE_QR_MAX_CHARS) {
    return { mode: 'single', frames: [{ index: 1, total: 1, text: `HEB1:1/1:${id}:${payload}` }] };
  }
  const total = Math.ceil(payload.length / QR_CHUNK_SIZE);
  if (total > MAX_QR_CHUNKS) return { mode: 'file', frames: [] };
  const frames = Array.from({ length: total }, (_, i) => ({
    index: i + 1,
    total,
    text: `HEB1:${i + 1}/${total}:${id}:${payload.slice(i * QR_CHUNK_SIZE, (i + 1) * QR_CHUNK_SIZE)}`,
  }));
  return { mode: 'multi', frames };
};

/** Ensambla fragmentos en cualquier orden, tolerando repetidos. */
export class QrFrameAssembler {
  private parts = new Map<number, string>();
  private total = 0;
  private id = '';

  /** Devuelve `true` si el texto era un fotograma nuevo válido. */
  add(text: string): boolean {
    const m = FRAME_RE.exec(text.trim());
    if (!m) return false;
    const [, i, n, id, data] = m;
    const index = Number(i);
    const total = Number(n);
    if (index < 1 || total < 1 || index > total) return false;
    if (this.total && (this.id !== id || this.total !== total)) {
      this.reset(); // QR de otro respaldo: empezar de nuevo
    }
    this.total = total;
    this.id = id;
    if (this.parts.has(index)) return false;
    this.parts.set(index, data);
    return true;
  }

  get progress() {
    return { received: this.parts.size, total: this.total };
  }

  get complete(): boolean {
    return this.total > 0 && this.parts.size === this.total;
  }

  assemble(): string {
    if (!this.complete) throw new BackupError('INCOMPLETE', 'Faltan fragmentos por escanear.');
    let out = '';
    for (let i = 1; i <= this.total; i++) out += this.parts.get(i);
    if (shortId(out) !== this.id) throw new BackupError('INTEGRITY', 'Los fragmentos no coinciden entre sí.');
    return out;
  }

  reset(): void {
    this.parts.clear();
    this.total = 0;
    this.id = '';
  }
}

/** Matriz QR con corrección de errores 'M'. */
export const qrMatrixM = (text: string): boolean[][] => {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
};

export const qrToSvgPath = (matrix: boolean[][]): string =>
  matrix
    .map((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : '')).join(''))
    .join('');
