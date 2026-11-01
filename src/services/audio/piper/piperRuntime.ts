/**
 * Runtime real de síntesis Piper on-device (FC-09).
 *
 * Orquesta dos piezas descargadas/ejecutadas bajo demanda:
 *   1. `onnxruntime-web` (inferencia del modelo ONNX de la voz).
 *   2. el fonemizador espeak-ng compilado a WASM (`@diffusionstudio/piper-wasm`),
 *      que convierte texto → ids de fonemas para la voz (`espeak.voice`, aquí `eu`).
 *
 * Todo se carga de forma perezosa (dynamic import / inyección de `<script>`) para
 * que el bundle principal nunca arrastre el runtime ONNX. Los pesos (.onnx) se
 * descargan del CDN canónico y el service worker los cachea CacheFirst (offline
 * tras la primera síntesis), igual que los modelos Whisper/WebLLM.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * CONTRATO ONNX VERIFICADO con onnxruntime-node (piper 1.3.0, voces eu_ES-*-medium):
 *   inputs:  `input`          int64  [1, N]   ids de fonemas
 *            `input_lengths`  int64  [1]      longitud real
 *            `scales`         float32 [3]     [noise_scale, length_scale, noise_w]
 *   output:  `output`         float32 [1,1,1,T] audio mono (sample_rate 22050);
 *            las T muestras están en `output.data` como Float32Array plano.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { PiperVoiceDescriptor } from './piperVoices';
import { piperModelUrl } from './piperVoices';

/** Parámetros de inferencia (espejo del `inference` del `.onnx.json`). */
export interface PiperInferenceParams {
  noiseScale: number;
  lengthScale: number;
  noiseW: number;
}

/** Interfaz mínima de la sesión ONNX (para desacoplarnos de los tipos internos). */
export interface OrtSessionLike {
  run(feeds: Record<string, unknown>): Promise<Record<string, { data?: Float32Array | number[] }>>;
}

/** Interfaz mínima del módulo onnxruntime-web (dynamic import). */
interface OrtModule {
  env?: { allowLocalModels?: boolean; wasm?: { numThreads?: number } };
  InferenceSession: {
    create(buffer: Uint8Array, options?: Record<string, unknown>): Promise<OrtSessionLike>;
  };
  Tensor: new (
    type: 'int64' | 'float32' | 'float64',
    data: BigInt64Array | Float32Array | Float64Array,
    dims: number[],
  ) => unknown;
}

/** Interfaz mínima del módulo Emscripten `createPiperPhonemize`. */
interface PiperPhonemizeFactory {
  (opts: {
    print: (line: string) => void;
    printErr: (line: string) => void;
    locateFile: (file: string) => string;
  }): Promise<{ callMain: (args: string[]) => void }>;
}

/** Base CDN del fonemizador euskaldun (espeak-ng + datos completos, incluye `eu`). */
const PHONEMIZER_BASE =
  'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize';

/* ------------------------- onnxruntime-web (carga perezosa) ---------------- */

let ortPromise: Promise<OrtModule> | null = null;

function ort(): Promise<OrtModule> {
  if (!ortPromise) {
    // Import diferido: mantiene el runtime ONNX fuera del bundle principal y
    // solo lo carga la primera vez que Piper sintetiza.
    ortPromise = import('onnxruntime-web') as Promise<OrtModule>;
  }
  return ortPromise;
}

async function fetchModelBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Piper: descarga fallida (${res.status}) en ${url}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

/** Caché en memoria de sesiones por voz (idempotente tras la primera carga). */
const sessions = new Map<string, OrtSessionLike>();

export async function ensureSession(voice: PiperVoiceDescriptor): Promise<OrtSessionLike> {
  const cached = sessions.get(voice.id);
  if (cached) return cached;

  const o = await ort();
  if (o.env) {
    // El modelo host se sirve por fetch explícito (no hay ruta local a permitir);
    // un solo hilo evita requerir cross-origin isolation / SharedArrayBuffer.
    o.env.allowLocalModels = false;
    if (o.env.wasm) o.env.wasm.numThreads = 1;
  }

  const modelBytes = await fetchModelBytes(piperModelUrl(voice));
  const session = await o.InferenceSession.create(modelBytes, {
    executionProviders: ['wasm'],
  });
  sessions.set(voice.id, session);
  return session;
}

/* -------------------------- Fonemizador (espeak-ng WASM) ------------------- */

let phonemizeFactory: PiperPhonemizeFactory | null = null;
let phonemizeFactoryPromise: Promise<PiperPhonemizeFactory> | null = null;

function loadPhonemizer(): Promise<PiperPhonemizeFactory> {
  const w = globalThis as unknown as { createPiperPhonemize?: PiperPhonemizeFactory };
  if (phonemizeFactory) return Promise.resolve(phonemizeFactory);
  if (typeof w.createPiperPhonemize === 'function') {
    phonemizeFactory = w.createPiperPhonemize;
    return Promise.resolve(phonemizeFactory);
  }
  if (phonemizeFactoryPromise) return phonemizeFactoryPromise;

  phonemizeFactoryPromise = new Promise<PiperPhonemizeFactory>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Piper: el fonemizador WASM requiere DOM (carga por <script>)'));
      return;
    }
    const script = document.createElement('script');
    script.src = `${PHONEMIZER_BASE}.js`;
    script.async = true;
    script.onload = () => {
      if (typeof w.createPiperPhonemize === 'function') {
        phonemizeFactory = w.createPiperPhonemize;
        resolve(phonemizeFactory);
      } else {
        reject(new Error('Piper: createPiperPhonemize no se expuso tras cargar el fonemizador'));
      }
    };
    script.onerror = () => reject(new Error('Piper: fallo al cargar el fonemizador WASM'));
    document.head.appendChild(script);
  });
  return phonemizeFactoryPromise;
}

/** Convierte texto → ids de fonemas espeak-ng para una voz concreta. */
export async function phonemize(text: string, espeakVoice: string): Promise<number[]> {
  const factory = await loadPhonemizer();

  return new Promise<number[]>((resolve, reject) => {
    factory({
      print: (line: string) => {
        try {
          const parsed = JSON.parse(line) as { phoneme_ids?: unknown };
          if (parsed && Array.isArray(parsed.phoneme_ids)) {
            resolve(parsed.phoneme_ids as number[]);
          }
        } catch {
          // Línea no-JSON (banner / log): ignorar.
        }
      },
      printErr: (line: string) => {
        if (line) reject(new Error(`Piper fonemizador: ${line}`));
      },
      locateFile: (file: string) =>
        file.endsWith('.wasm')
          ? `${PHONEMIZER_BASE}.wasm`
          : file.endsWith('.data')
            ? `${PHONEMIZER_BASE}.data`
            : file,
    })
      .then((mod) => {
        mod.callMain([
          '-l',
          espeakVoice,
          '--input',
          JSON.stringify([{ text: text.trim() }]),
          '--espeak_data',
          '/espeak-ng-data',
        ]);
      })
      .catch(reject);
  });
}

/* ------------------------------ Inferencia -------------------------------- */

/** Ejecuta la inferencia VITS (texto ya fonemizado → audio PCM). */
export async function synthesize(
  session: OrtSessionLike,
  phonemeIds: number[],
  params: PiperInferenceParams,
): Promise<Float32Array> {
  if (phonemeIds.length === 0) {
    throw new Error('Piper: fonemización vacía (sin ids de fonemas)');
  }

  const o = await ort();
  const Tensor = o.Tensor;

  const input = new Tensor(
    'int64',
    new BigInt64Array(phonemeIds.map((id) => BigInt(id))),
    [1, phonemeIds.length],
  );
  const inputLengths = new Tensor('int64', new BigInt64Array([BigInt(phonemeIds.length)]), [1]);
  const scales = new Tensor(
    'float32',
    new Float32Array([params.noiseScale, params.lengthScale, params.noiseW]),
    [3],
  );

  const feeds: Record<string, unknown> = {
    input,
    input_lengths: inputLengths,
    scales,
  };

  const outputs = await session.run(feeds);
  const audioTensor = outputs['output'] ?? outputs[Object.keys(outputs)[0] ?? ''];
  const data = audioTensor?.data;
  if (!data) {
    throw new Error('Piper: la inferencia no produjo un tensor de salida `output`');
  }

  const samples = data instanceof Float32Array ? data : new Float32Array(data as number[]);
  if (samples.length === 0) {
    throw new Error('Piper: audio de salida vacío');
  }
  // La salida tiene forma [1,1,1,T]; `data` es un Float32Array plano con las
  // T muestras de audio (verificado con onnxruntime-node).
  return samples;
}