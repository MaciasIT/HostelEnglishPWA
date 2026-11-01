# [FC-08] Fallback API (Workers AI / Gemini) para dispositivos sin WebGPU

> Implementación del cliente de inferencia cloud con streaming y el router híbrido
> que conmuta de forma transparente desde el motor local (FC-07) cuando el
> dispositivo no soporta WebGPU o se queda sin memoria.
> Estado: implementado y verificado a nivel de tsc + unit tests. La ruta cloud
> requiere desplegar un proxy (ver §4) para funcionar end-to-end.

## 1. Decisión de arquitectura

El fallback habla con un **endpoint proxy OpenAI-compatible** (`POST /v1/chat/completions`,
respuesta SSE) que, en el servidor, enruta a **Cloudflare Workers AI**
(`@cf/meta/llama-3.2-3b-instruct`) o a un proxy de **Gemini**. Se elige el contrato
OpenAI-compatible porque:

- Es soportado por Workers AI y por el endpoint `…/v1beta/openai/chat/completions` de Gemini.
- Coincide con el formato que ya usa el worker local (`engine.chat.completions.create`),
  lo que maximiza la paridad de código.
- Permite **SSE puro** (`stream: true`), sin dependencias extra en el cliente.

La API key **nunca viaja al cliente**: el proxy la inyecta en el servidor. El bundle
PWA solo conoce la URL del proxy (`VITE_LLM_PROXY_URL`), compilada como texto plano y
sin más valor que el endpoint.

## 2. Ficheros

| Fichero | Responsabilidad |
|---|---|
| `src/services/llm/cloudLLMClient.ts` | Cliente `CloudLLMClient` con `fetch` streaming + parser SSE/NDJSON + reintentos. |
| `src/services/llm/cloudMetrics.ts` | Métricas de latencia/uso en IndexedDB (`hostel-llm-metrics`). |
| `src/services/llm/hybridEngine.ts` | `HybridLLMEngine`: router local ⇄ cloud con switch transparente. |
| `src/services/llm/llmTypes.ts` | (extendido) códigos de error `NO_ENDPOINT`/`NETWORK`/`HTTP_ERROR`/`INVALID_RESPONSE` y `LLMError.retryable`. |

## 3. Switch transparente (contrato con FC-07 §6)

- `HybridLLMEngine.detect()` → `getLLMCapability()`. Si `supported === false`, la ruta es cloud.
- `HybridLLMEngine.prepare()` carga el modelo local solo si está soportado; si la carga
  rechaza con `WEBGPU_UNSUPPORTED`/`OOM`/`DEVICE_LOST`, conmuta a cloud.
- `HybridLLMEngine.generate()` enruta local; si una generación local rechaza con esos
  mismos códigos, redirige a cloud **con los mismos `callbacks`/`options`**, sin cambios en la UI.
- La firma de generación es idéntica a `LocalLLMEngine.generate(messages, callbacks, options)`.

FC-03 (gestor de roleplay) solo tiene que consumir `getHybridLLMEngine()` en lugar de
`getLocalLLMEngine()`; la interfaz y el streaming token-a-token no cambian.

## 4. Contrato del proxy (pendiente de desplegar)

El cliente envía `POST {endpoint}` con body:

```json
{
  "model": "@cf/meta/llama-3.2-3b-instruct",
  "messages": [{"role":"system","content":"…"},{"role":"user","content":"…"}],
  "stream": true,
  "max_tokens": 256,
  "temperature": 0.7,
  "top_p": 0.9
}
```

y espera SSE `data: {"choices":[{"delta":{"content":"…"}}]}` con sentinel `data: [DONE]`
(también acepta NDJSON). El proxy debe:

1. Validar/elegir el modelo y **añadir la API key en el servidor** (Workers AI `Authorization`,
   o Gemini `x-goog-api-key`).
2. Reenviar `stream: true` y retransmitir el SSE tal cual.
3. **No** aceptar claves desde el cuerpo (ignorar cualquier campo `api_key`).

Configuración en el front:

```bash
# .env
VITE_LLM_PROXY_URL=https://<account>.workers.dev/v1/chat/completions
```

Sin `VITE_LLM_PROXY_URL` el cliente degrada con `NO_ENDPOINT` (mensaje claro, sin crash).

## 5. Manejo de desconexión

- Fallo de conexión/HTTP **antes del primer token** → reintento (backoff exponencial,
  `maxRetries` = 2, base 500 ms). Si `navigator.onLine === false`, no reintenta.
- Corte a mitad de stream → `NETWORK` con `retryable: true` (los tokens ya emitidos se conservan).
- Abort por el usuario → `ABORTED` (sin reintento).
- `429`/`5xx` → `HTTP_ERROR` retryable; `4xx` → no retryable.

## 6. Métricas (IndexedDB)

Cada generación cloud registra en `hostel-llm-metrics` (BD independiente): `ts`, `route`,
`model`, `promptTokens`, `completionTokens`, `firstTokenMs`, `elapsedMs`, `ok`, `errorCode`.
Accesibles vía `CloudMetricsStore.recent()` para telemetría local (privacidad local-first).

## 7. Verificación

- `npx tsc -p tsconfig.json --noEmit`: 0 errores nuevos (persisten 3 preexistentes ajenos).
- `npx vitest run src/services/llm/`: 52/52 en verde (cloudLLMClient, cloudMetrics, hybridEngine
  + los 30 de FC-07).
- `npx vitest run` (suite completa): 348/348 en verde.
- **Pendiente — despliegue del proxy** y prueba real end-to-end en un dispositivo sin WebGPU.

> **Nota de build (preexistente de FC-07):** `npm run build` emite el chunk
> `llm.worker-*.js` (~6 MB, runtime WebLLM) que excede el límite de precache de 2 MiB de
> Workbox y aborta con `PLUGIN_ERROR`. No introducido por FC-08 (los ficheros nuevos no se
> importan desde ningún entry; el chunk ya existía en `7352bde`). Requiere fijar
> `workbox.maximumFileSizeToCacheInBytes` en `vite.config.ts` como tarea de seguimiento.