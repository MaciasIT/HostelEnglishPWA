# [F1-Discovery] Core IA: Audio, Roleplay Conversacional y Pronunciación On-Device / Híbrida 2026

> Documento de arquitectura, benchmarks y plan de integración para la evolución del módulo de voz de HostelInglés PWA.
> Estado: discovery. No modifica `src/`. Sirve como base para la fase de implementación F2.

---

## 1. Diagnóstico actual

### 1.1 Puntos fuertes heredados
- **PWA offline-first**: React 18 + Vite 8 + Zustand slices + IndexedDB.
- **TTS híbrido** con parche fonético `euToEsPhonetic` (`src/utils/audio.ts`).
- **Reconocimiento** vía Web Speech API (`src/hooks/useSpeechRecognition.ts`).
- **Base de frases** hotelera curada (640 frases, 90+ conversaciones estáticas).

### 1.2 Limitaciones reales
- **Web Speech API** es caja negra: sin control de modelo, sin versionado, sin dominio sobre vocabulario hotelero.
- **TTS nativo** dependiente de voces del sistema; cobertura de acentos y registros limitada.
- **Evaluación binaria**: matching texto-plano; no captura errores fonéticos típicos de hispanohablantes (th → s/z, vocalización de r final, ritmo).
- **Euskera**: dependiente de Google Translate TTS no oficial y traducciones aproximadas en vez de modelos nativos.

---

## 2. Objetivos de la capa IA 2026

1. **Roleplay conversacional**: alumno como camarero/recepcionista, IA como cliente, con variabilidad de acento/registro.
2. **Pronunciación inteligente**: scoring fonético (accuracy, ritmo, claridad) y detección de errores frecuentes en inglés hotelero.
3. **On-device primero**: 100 % offline y coste cero de servidor en dispositivos capaces; fallback API streaming para gama baja.
4. **Euskera**: sustituir el parche aproximado por TTS/ASR real con voces y modelo específico.

---

## 3. Arquitectura propuesta

### 3.1 Diagrama de componentes (texto)

```
App React (PWA)
├── AudioManager
│   ├── TTS Engine Selector
│   │   ├── Piper TTS (on-device) → .onnx / WASM
│   │   ├── Web Speech Synthesis (fallback nativo)
│   │   └── Gemini Live / Workers AI TTS (API híbrida streaming)
│   └── ASR Engine Selector
│       ├── Transformers.js Whisper (Web Worker) → on-device
│       ├── Web Speech Recognition (fallback)
│       └── Gemini Live Audio / Workers AI Whisper (API híbrida)
├── ConversationEngine
│   ├── LocalLLMRunner (WebLLM / Transformers.js) → roleplay offline
│   └── RemoteLLMProxy (Workers AI / Gemini) → fallback streaming
├── PronunciationScorer
│   ├── PhoneticAligner (espeak-ng + DTW/Wav2Vec2)
│   └── HotelErrorPatterns (catálogo de errores hispanohablantes)
└── EuskeraModule
    ├── Piper Basque Voices (Antton/Maider)
    └── Whisper-large-v2-eu (HiTZ) ASR
```

### 3.2 Principios de diseño
- **Engine selector por dispositivo**: feature detection (`navigator.gpu`, `WebGPUSupported`, memoria libre estimada).
- **Cache-first para modelos**: Cache API + OPFS para pesos; primera visita descarga, siguientes sesiones arrancan en < 2 s.
- **Worker threads obligatorios**: ASR y LLM en Web Worker / Service Worker para no bloquear UI.
- **Fallback jerárquico**: on-device → API streaming → TTS/ASR nativo. Nunca perder funcionalidad.
- **Telemetría local únicamente**: métricas de latencia, VRAM/Heap y error rate en IndexedDB; sin envío a terceros sin opt-in.

---

## 4. Análisis por área

### 4.1 Roleplay conversacional con IA

#### Requisitos específicos
- Sistema de diálogos por turnos con contexto hotelero predefinido (recepciones, room service, quejas).
- Variabilidad de acento/registro controlada mediante prompts y system prompts.
- Pistas en tiempo real (sugerencias de frases) y corrección contextual pos-utterance.

#### Opción A — On-device: WebLLM / Transformers.js + WebGPU
- **Modelo base recomendado**: Qwen2.5 1.5B/3B Instruct o Llama 3.2 1B/3B Instruct (cuantizados 4-bit).
- **Framework**: Transformers.js v3+ (cobertura multimodal: texto + embeddings + audio) o WebLLM si solo necesitas chat.
- **Benchmark decodificación** (datos reales 2025/2026):
  - Llama 3.2 1B q4 en WebGPU M3 Pro: 27–67 tok/s; p50 latency ~52 ms tras carga.
  - Qwen2.5 1.5B: similar throughput en dispositivos con GPU integrada decente (2020+).
- **Cold start**: 695 MB–1.5 GB de descarga inicial; con cache, rearranque en 1.4–3 s (shader compilation).
- **Memoria GPU**: ~1 GB para 1B, ~2.2 GB para 3B, ~5 GB para 8B.

**Veredicto**: viable para dispositivos con > 4 GB RAM y WebGPU. Produce latencia aceptable (p50 < 100 ms/turno corto) y cero coste. Limitación: dispositivos antiguos sin WebGPU quedan fuera.

#### Opción B — API híbrida: Cloudflare Workers AI
- **Modelos**: `@cf/meta/llama-3.2-1b-instruct`, `@cf/meta/llama-3.2-3b-instruct`, `@cf/meta/llama-3.1-8b-instruct-fast`.
- **Precio**: $0.027–$0.051 por 1 M input tokens; $0.201–$0.335 por 1 M output tokens.
- **Throughput**: 80+ tok/s, TTFT ~300 ms en new GPUs.
- **Ventaja**: sin cold start, sin límite de VRAM local, streaming SSE nativo.
- **Desventaja**: mínimo $5/mes en plan Paid; depende de red.

**Veredicto**: mejor como fallback para dispositivos de gama baja, no como ruta principal si el objetivo es offline.

#### Opción C — API híbrida: Gemini 2.5 Flash / 3.8 Flash (streaming)
- **Estado**: Gemini 2.0 Flash deprecado desde 2026-06-01; usar Gemini 2.5 Flash o 3.8 Flash.
- **Precio** (texto): input $0.15–$0.30 / 1 M tokens; output $0.60–$2.00 / 1 M tokens.
- **Live API (audio nativo)**: input audio $3.00 / 1 M tokens; output audio $12.00 / 1 M tokens. 25 tokens/segundo de audio.
- **Latencia**: p50 200–400 ms para tareas cortas; streaming estable.
- **Ventaja**: mejor razonamiento y manejo de contexto largo (1M tokens en 2.5 Flash).

**Veredicto**: reservar para roleplay complejo o multimodal en dispositivos que no corran WebGPU. Para el uso hotelero (turnos cortos, vocabulario fijo), Workers AI 1B–3B es más barato y suficiente.

#### Diseño del prompt de roleplay
```
System: Eres un cliente en un hotel británico formal / estadounidense casual.
Situation: {checkin|room_service|complaint|checkout}
Constraints:
- Vocabulario nivel B1-B2, hotelero.
- 1 pregunta o petición por turno como máximo.
- Si el alumno se bloquea >8 s, ofrece una pista suave.
- No reveles que eres IA.
```

---

### 4.2 Evaluación inteligente de pronunciación

#### Enfoque recomendado: pipeline fonético local
1. **Grabación**: AudioWorklet / MediaRecorder → 16 kHz mono WAV.
2. **Transcripción referencia**: usar el texto objetivo de la frase hotelera (no dependemos de un ASR perfecto para la referencia).
3. **Fonemización**: `espeak-ng` o `phonemizer` con diccionario CMU para inglés + reglas de excepciones hoteleras.
4. **Alineación forzada**: modelo pequeño Wav2Vec2 CTC fine-tuned o DTW entre embeddings del alumno y sintetizados nativos.
5. **Scoring**:
   - **Accuracy**: distancia de edición entre secuencias fonéticas esperada vs. oída (0–100).
   - **Completeness**: % de fonemas objetivo presentes.
   - **Fluency**: varianza de duración entre fonemas y pausas (RMS + pitch via pYIN).
   - **Prosody**: comparación de contornos de pitch/energía vs. referencia nativa.
   - **Peso final**: `0.4 * accuracy + 0.3 * completeness + 0.3 * fluency`, recortado a [0, 100].

#### Catálogo de errores hispanohablantes (hotelero)
| Error típico | Fonema esperado | Patrón detectado | Ejemplo |
|---|---|---|---|
| Sustitución th → s/z | /θ/ /ð/ | contiene `s`/`z` en posición dental | "think" → "sink" |
| Vocalización r final | /r/ | ausencia de vibración alveolar | "room" → "room" con R débil |
| Confusión v/b | /v/ /b/ | sustitución por bilabial | "very" → "berry" |
| Reducción de diptongos | /əʊ/ /aɪ/ | monoftongación | "breakfast" → "brekfast" |
| Palatalización de l | /l/ | [ʎ] en sílaba trabada | "hotel" → "otel" |

#### Herramientas posibles
- **OpenPronounce** (Wav2Vec2 + DTW, CPU, on-prem): punto de partida para inglés; calibración propia necesaria para hotelero.
- **GOPT-based Transformer** (paper 2026, GOP features): alternativa más moderna si se quiere modelar fluency/prosody de forma más fina.
- **Transformers.js Wav2Vec2**: viable en navegador para embeddings locales; DTW pesado puede requiring Web Worker.

**Decisión**: empezar por reglas fonéticas + Wav2Vec2 en Transformers.js. Añadir modelo GOP solo si se requiere precisión clínica.

---

### 4.3 Factibilidad técnica: On-device vs Híbrida

#### Comparativa 2026

| Approach | p50 Latency | p95 Latency | Coste/1M tokens | Privacidad | RAM mínima | Offline | Complejidad |
|---|---|---|---|---|---|---|---|
| WebGPU (WebLLM/T.js) | 52 ms | 89 ms | $0 | Completa | 4 GB | Sí | Alta |
| WebAssembly (CPU) | 187 ms | 312 ms | $0 | Completa | 2 GB | Sí | Media |
| Cloudflare Workers AI | ~100 ms | ~200 ms | ~$30–60/1M tok | Parcial | 512 MB | No | Baja |
| Gemini 2.5 Flash | ~300 ms | ~700 ms | ~$150–2000/1M tok | Parcial | 512 MB | No | Baja |

> Fuentes: benchmarks WebLLM 2026, Cloudflare blog, Gemini pricing docs, experiencias en producción.

#### Recomendación
- **Ruta primaria**: Transformers.js + WebGPU para ASR y LLM en dispositivos con GPU.
- **Ruta secundaria**: Workers AI streaming como fallback cuando `navigator.gpu` no está disponible o RAM < 4 GB.
- **TTS**: Piper TTS on-device como primera opción; si no, Web Speech Synthesis nativo.

---

### 4.4 Mejora del soporte de Euskera

#### Estado actual
- `euToEsPhonetic`: parche ad-hoc que aproxima sonidos vascos a grafía castellana.
- Limitaciones: no captura matices dialectales, silabeo irregular y dependencia de voces españolas.

#### Oportunidades reales en 2026

| Componente | Modelo | Formato | Tamaño | WER/Calidad |
|---|---|---|---|---|
| ASR | HiTZ/whisper-large-v2-eu | ONNX / Transformers.js | ~1.5 GB | 11.34 % WER |
| ASR ligero | HiTZ/whisper-base-eu | ONNX | ~150 MB | 25.98 % WER |
| TTS | Piper Antton/Maider (Basque) | ONNX | ~75 MB | Nativo |
| TTS | Orai/otro motor neuronal | depende | — | Mejor prosodia |

**Plan**:
1. **Fase 1**: reemplazar el fallback Google Translate TTS por Piper Antton/Maider. Sin dependencia externa, offline, sin parches fonéticos.
2. **Fase 2**: sustituir Web Speech Recognition por Whisper-base-eu en Transformers.js (WebGPU/WASM).
3. **Fase 3 (si se requiere mayor calidad)**: evaluar fine-tuning de un modelo TTS neuronal pequeño con corpus vasco propio.

---

## 5. Stack tecnológico recomendado

### 5.1 Dependencias core
```json
{
  "@huggingface/transformers": "^3.8.1",
  "@mlc-ai/web-llm": "^0.2.85",
  "onnxruntime-web": "latest",
  "espeak-ng": "latest",
  "piper-tts": "latest",
  "wavefile": "latest"
}
```

### 5.2 Servicios externos (fallback)
- **Cloudflare Workers AI**: `@cf/meta/llama-3.2-3b-instruct` para roleplay streaming.
- **Gemini 2.5 Flash**: reservado para dispositivos sin GPU y turnos complejos (opcional).

### 5.3 Estructura de carpetas (nueva, no tocar `src/` aún)
```
src/
  services/
    audio/
      piperTTS.ts
      phoneticScorer.ts
      wav2vec2Embedder.ts
    llm/
      localEngine.ts
      remoteEngine.ts
      roleplayPromptBuilder.ts
    euskera/
      basqueASR.ts
      basqueTTS.ts
  workers/
    asr.worker.ts
    llm.worker.ts
```

---

## 6. Benchmarks medidos y estimados

### 6.1 Modelos on-device
| Modelo | Tipo | Tamaño | VRAM | tok/s (WebGPU) | Cold start | Caso de uso |
|---|---|---|---|---|---|---|
| Llama 3.2 1B q4 | LLM | 695 MB | ~880 MB | 27–67 | 1.4–3 s | Roleplay ligero |
| Qwen2.5 1.5B q4 | LLM | ~1 GB | ~1.2 GB | 30–60 | 2–4 s | Roleplay general |
| Qwen2.5 3B q4 | LLM | ~1.8 GB | ~2.2 GB | 20–45 | 3–5 s | Roleplay complejo |
| Whisper Tiny q8 | ASR | 39 MB | — | 2–4 s/30s audio | < 1 s | Transcripción corta |
| Whisper Base q8 | ASR | 73 MB | — | 4–8 s/30s audio | < 1 s | ASR precisa |
| Piper Basque | TTS | ~75 MB | CPU | >1x tiempo real | < 1 s | Euskera offline |

### 6.2 Servicios API
| Servicio | Modelo | TTFT | Throughput | Precio input | Precio output |
|---|---|---|---|---|---|
| Cloudflare Workers AI | Llama 3.2 3B | ~300 ms | 80+ tok/s | $0.051/1M tok | $0.335/1M tok |
| Gemini 2.5 Flash | gemini-2.5-flash | ~200–400 ms | variable | $0.30/1M tok | $2.00/1M tok |

### 6.3 Pronunciación
| Métrica | Fuente | Valor |
|---|---|---|
| WER Basque ASR (Whisper-large-v2-eu) | HiTZ | 11.34 % |
| WER Basque ASR ligero (Whisper-base-eu) | HiTZ | 25.98 % |
| Accuracy phoneme-level (OpenPronunge inglés) | Halleck45 | 0–100 escala |
| Acoustic distance (DTW + Wav2Vec2) | GOPT paper | 6–15 rango calibrado |

---

## 7. Plan de migración por fases

### Fase 1 — Infraestructura de audio y workers (F2a)
1. Añadir Piper TTS on-device con descarga perezosa de voces inglesas y vascas.
2. Mover ASR a Web Worker con Transformers.js Whisper Tiny/Base (WebGPU con fallback WASM).
3. Implementar `AudioManager` centralizado con selector de engine por dispositivo.

**Criterio de salida**: `npm run test` verde, < 3 s cold start en dispositivo con WebGPU, audio comprensible en inglés y euskera.

### Fase 2 — Scoring de pronunciación (F2b)
1. Implementar `phoneticScorer.ts` con espeak-ng + DTW + catálogo de errores hispanohablantes.
2. Integrar feedback visual en UI existente (no tocar lógica de negocio de frases).

**Criterio de salida**: correlación > 0.7 con juicio humano en dataset de 50 frases hotelero.

### Fase 3 — Roleplay LLM on-device (F2c)
1. Integrar WebLLM o Transformers.js para LLM en Worker.
2. Definir system prompts por escenario hotelero con variabilidad de acento/registro.
3. Implementar pistas en tiempo real y corrección contextual post-turno.

**Criterio de salida**: 5 turnos coherentes sin alucinaciones fuera de dominio, latencia p95 < 5 s en device gama media.

### Fase 4 — Fallback API y Euskera completo (F2d)
1. Configurar proxy Workers AI para dispositivos sin WebGPU.
2. Reemplazar parche `euToEsPhonetic` por Piper Basque + Whisper-base-eu.
3. Documentar resultados y benchmarks finales.

**Criterio de salida**: 100 % cobertura en dispositivos testados (Chrome Android, Safari iOS, desktop), cero dependencia de Google Translate TTS.

---

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| WebGPU no soportado en dispositivo del usuario | Media | Alto | Feature detection + fallback a Workers AI / WASM CPU |
| Cold start > 5 s en 3G | Media | Medio | Precargar modelo en Wi-Fi; mostrar progreso; usar modelo ligero (1B) |
| Overfitting de prompts a acentos irreales | Baja | Medio | Validación humana con hablantes nativos; dataset de acentos diverso |
| WER alto en Whisper-base-eu con ruido ambiente | Media | Medio | VAD previo; denoise ligero; Whisper-large-v2-eu como opción offline |
| Coste Workers AI inesperado | Baja | Bajo | Presupuesto diario + rate limiting + métricas locales |
| Mantenimiento de Transformers.js | Baja | Alto | Pin versiones; vendorizar ONNX en cache; tener fallback nativo |

---

## 9. Decisiones de arquitectura documentadas

1. **No usar Gemini 2.0 Flash**: deprecado desde 2026-06-01. Usar Gemini 2.5 Flash o 3.8 Flash solo como fallback premium.
2. **No usar Google Translate TTS para Euskera**: sustituir por Piper Basque para eliminar dependencia externa y mejorar calidad.
3. **Priorizar Transformers.js sobre WebLLM**: mayor flexibilidad (ASR + embeddings + LLM en un mismo runtime), fallback WASM automático.
4. **Scoring fonético local**: no delegar a API externa por privacidad y coste; empezar simple y escalar a GOP solo si se necesita.
5. **Roleplay con LLM 1B–3B**: suficiente para dominio hotelero B1-B2; reservar 7B+ para casos específicos con hardware potente.

---

## 10. Próximos pasos inmediatos

1. **Validar hardware**: comprobar `navigator.gpu`, RAM disponible y rendimiento real en dispositivos objetivo (Android 10+, iOS 15+).
2. **Prototipo Piper TTS**: grabar samples de Antton y Maider, medir latencia y calidad percibida.
3. **Prototipo Whisper Tiny**: benchmark de transcripción en Web Worker con frases hotelero reales.
4. **Dataset de errores**: recopilar 100 ejemplos de errores típicos de hispanohablantes en contexto hotelero para calibrar scoring.

---

*Documento generado en contexto F1-Discovery. Para implementación, seguir skill `ciclo-trabajo` y branch `feat/ia-audio-2026`.*
