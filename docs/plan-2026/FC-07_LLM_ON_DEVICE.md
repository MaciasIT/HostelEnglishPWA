# [FC-07] Motor LLM on-device en Web Worker para roleplay local

> Implementación del runtime de inferencia local (WebLLM) en un Web Worker dedicado.
> Estado: implementado y verificado a nivel de build + unit tests. La medición real de
> tok/s en WebGPU requiere una prueba en dispositivo (ver §5).

## 1. Decisión de arquitectura

Se implementa **WebLLM (`@mlc-ai/web-llm` v0.2.87)** — no Transformers.js — para el
roleplay, reconciliando el ADR de discovery (`04_CAPA_IA_Y_AUDIO_2026.md` §9.3, que
priorizaba Transformers.js por multimodalidad). Razón: para *chat puro* de roleplay,
WebLLM aporta streaming nativo, selectores por dispositivo, caché de pesos y override de
KV cache con menos fricción. Transformers.js queda reservado para ASR/embeddings (FC-02).

Modelo: **`Llama-3.2-1B-Instruct-q4f16_1-MLC`** (~700 MB pesos).

## 2. Control de memoria (context window)

El KV cache se reserva íntegro en `context_window_size` al cargar. El modelo base declara
131072, lo que excedería la VRAM móvil. Se sobreescribe a **1024 tokens** en `reload()`:

```ts
await engine.reload(modelId, {
  context_window_size: 1024,   // 131072 → 1024 reduce el KV cache ~2.9GB → ~0.88GB (1B q4)
  sliding_window_size: -1,
  attention_sink_size: -1,
});
```

Además, `contextWindow.ts` recorta el historial de mensajes a `1024 − max_tokens` antes
de cada petición (heurística conservadora ≈ 1 token / 3.5 chars), garantizando que nunca
se desborde el KV cache. Ante `OOM`/`DeviceLostError` durante la carga, el worker
reintenta automáticamente con la ventana a la mitad (mín. 512).

## 3. Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `src/services/llm/llmTypes.ts` | Tipos compartidos y constantes (modelo, 1024 tokens, samplers). |
| `src/services/llm/webgpuDetection.ts` | `isWebGPUSupported()`, `detectWebGPU()`, `getLLMCapability()`, RAM. |
| `src/services/llm/contextWindow.ts` | Estimación de tokens y recorte del historial. |
| `src/services/llm/roleplayPromptBuilder.ts` | System prompts por escenario de hostelería (6 escenarios). |
| `src/services/llm/localEngine.ts` | Clase `LocalLLMEngine` (hilo principal): load / generate / reset / unload. |
| `src/workers/llm.worker.ts` | `MLCEngine` en el worker + protocolo de mensajes. |
| `src/workers/llmWorkerFactory.ts` | `createLLMWorker()`. |
| `src/hooks/useLocalLLM.ts` | Hook React: `status`, `progress`, streaming (indicador de carga). |

## 4. Protocolo de mensajes (structured clone)

Hilo principal → worker: `LOAD | GENERATE | ABORT | RESET | UNLOAD | GPU_INFO`.
Worker → hilo principal: `PROGRESS | READY | TOKEN | COMPLETE | ABORTED | ERROR | GPU_INFO | RESET_DONE | UNLOAD_DONE`.

La API pública del engine emite los eventos requeridos `onToken` / `onComplete` / `onError`
y devuelve `LLMCompletionResult` con `tokPerSec`, `usage` y `finishReason`.

## 5. Caché de pesos

WebLLM usa **Cache Storage** por defecto (`cacheBackend: "cache"`); se expone `"opfs"`
(`Origin Private File System`) como alternativa vía `LocalLLMEngineConfig.cacheBackend`.
Primera visita descarga ~700 MB; las siguientes arrancan desde caché (cold start < 3 s).

## 6. Contrato de integración

- **FC-08 (fallback cloud):** llamar `LocalLLMEngine.getCapability()`. Si devuelve
  `supported: false` (o una generación rechaza con `WEBGPU_UNSUPPORTED`/`OOM`/`DEVICE_LOST`),
  enrutar a `src/services/llm/cloudLLMClient.ts` sin cambiar la UI. `LLMCapability.reason`
  explica por qué.
- **FC-03 (roleplay MVP):** consumir `useLocalLLM()` (estado `idle|loading|ready|generating`),
  `buildRoleplaySystemPrompt()` y `buildRoleplayMessages()` para los 5 escenarios.

## 7. Verificación

- `npx tsc -p tsconfig.json --noEmit`: 0 errores nuevos (persisten 3 preexistentes ajenos).
- `npx vitest run src/services/llm/`: 30/30 en verde (contextWindow, promptBuilder, webgpuDetection, localEngine).
- `npm run build`: limpio; el worker emite un chunk ~6 MB (`llm.worker-*.js`, runtime WebLLM) al ser importado.
- **Pendiente — prueba real en dispositivo**: los criterios de > 20 tok/s y cold start < 3 s
  requieren un navegador con WebGPU (Chrome/Edge en GPU integrada). No verificable en CI headless.